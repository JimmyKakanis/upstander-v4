import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { admin, auth, db } from '@/lib/firebase-admin';
import { isValidInviteEmail, normalizeInviteEmail } from '@/lib/server/email-normalize';

export const dynamic = 'force-dynamic';

/** Any signed-in user whose `users.schoolId` matches the body may invite by email. */
const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

let resendClient: Resend | null | undefined;

function getResend(): Resend | null {
  if (resendClient !== undefined) return resendClient;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    resendClient = null;
    return null;
  }
  resendClient = new Resend(key);
  return resendClient;
}

function generateInviteToken(): string {
  return randomBytes(24).toString('base64url');
}

export async function POST(req: NextRequest) {
  try {
    if (!admin.apps.length) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const resend = getResend();
    if (!resend) {
      const isDev = process.env.NODE_ENV === 'development';
      return NextResponse.json(
        {
          error: isDev
            ? 'Email invites need RESEND_API_KEY in .env.local (create a key at https://resend.com/api-keys, copy the line from .env.example, then restart the dev server).'
            : 'Invites by email are temporarily unavailable. Please try again later.',
        },
        { status: 503 }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await auth.verifyIdToken(authHeader.split('Bearer ')[1]);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const uid = decoded.uid;
    const body = await req.json();
    const schoolId = typeof body.schoolId === 'string' ? body.schoolId.trim() : '';
    const rawEmail = typeof body.email === 'string' ? body.email : '';
    if (!schoolId) {
      return NextResponse.json({ error: 'schoolId is required' }, { status: 400 });
    }
    if (!isValidInviteEmail(rawEmail)) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }

    const invitedEmailNormalized = normalizeInviteEmail(rawEmail);
    const inviterNorm = normalizeInviteEmail(decoded.email || '');
    if (inviterNorm && invitedEmailNormalized === inviterNorm) {
      return NextResponse.json({ error: 'Use a colleague’s email address, not your own.' }, { status: 400 });
    }

    const userSnap = await db.collection('users').doc(uid).get();
    const userSchool = userSnap.exists ? userSnap.data()?.schoolId : undefined;
    if (typeof userSchool !== 'string' || userSchool !== schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const schoolSnap = await db.collection('schools').doc(schoolId).get();
    if (!schoolSnap.exists) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const schoolName =
      typeof schoolSnap.data()?.name === 'string' ? schoolSnap.data()!.name : 'your school';

    const token = generateInviteToken();
    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromMillis(now.toMillis() + INVITE_TTL_MS);
    const invitedEmail = rawEmail.trim();

    const inviteRef = db.collection('schoolInvites').doc(token);
    await inviteRef.set({
      schoolId,
      invitedEmail,
      invitedEmailNormalized,
      createdBy: uid,
      createdAt: now,
      expiresAt,
      revoked: false,
      usedAt: null,
    });

    const origin = req.headers.get('origin');
    const base = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '') || origin || '';
    const joinPath = `/join?token=${encodeURIComponent(token)}`;
    const joinUrl = base ? `${base}${joinPath}` : joinPath;

    const { error: sendError } = await resend.emails.send({
      from: 'Upstander <noreply@upstander.help>',
      to: invitedEmail,
      subject: `You're invited to the Upstander dashboard for ${schoolName}`,
      html: `<p>You've been invited to join the Upstander staff dashboard for <strong>${escapeHtml(
        schoolName
      )}</strong>.</p>
<p><a href="${joinUrl}">Accept invitation</a></p>
<p>If the button does not work, copy this link into your browser:</p>
<p style="word-break:break-all;font-size:12px;color:#444">${escapeHtml(joinUrl)}</p>
<p>Use this email address when you sign in or create your account. The link is single-use and expires in 14 days.</p>`,
    });

    if (sendError) {
      console.error('Resend school invite error:', sendError);
      await inviteRef.delete();
      return NextResponse.json(
        { error: 'Could not send the invitation email. Please try again later.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/schools/invite:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

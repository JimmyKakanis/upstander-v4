import type { Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { admin, auth, db } from '@/lib/firebase-admin';
import { normalizeInviteEmail } from '@/lib/server/email-normalize';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (!admin.apps.length) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
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
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 });
    }

    const inviteRef = db.collection('schoolInvites').doc(token);
    const inviteSnap = await inviteRef.get();
    if (!inviteSnap.exists) {
      return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 });
    }

    const inv = inviteSnap.data() as Record<string, unknown>;
    if (inv.revoked === true) {
      return NextResponse.json({ error: 'This invite is no longer valid' }, { status: 410 });
    }
    if (inv.usedAt != null) {
      return NextResponse.json({ error: 'This invite has already been used' }, { status: 410 });
    }

    const expiresAt = inv.expiresAt as Timestamp | undefined;
    if (expiresAt && expiresAt.toMillis() < Date.now()) {
      return NextResponse.json({ error: 'This invite has expired' }, { status: 410 });
    }

    const schoolId = typeof inv.schoolId === 'string' ? inv.schoolId : '';
    if (!schoolId) {
      return NextResponse.json({ error: 'Invalid invite data' }, { status: 500 });
    }

    const schoolSnap = await db.collection('schools').doc(schoolId).get();
    if (!schoolSnap.exists) {
      return NextResponse.json({ error: 'School no longer exists' }, { status: 404 });
    }

    const expectedEmail =
      typeof inv.invitedEmailNormalized === 'string' ? inv.invitedEmailNormalized.trim() : '';
    if (!expectedEmail) {
      return NextResponse.json(
        {
          error:
            'This invite is no longer valid. Ask your school admin to send a new invitation by email.',
        },
        { status: 410 }
      );
    }
    const callerEmail = normalizeInviteEmail(decoded.email || '');
    if (!callerEmail || callerEmail !== expectedEmail) {
      return NextResponse.json(
        { error: 'Sign in with the email address this invitation was sent to.' },
        { status: 403 }
      );
    }

    const userRef = db.collection('users').doc(uid);
    const adminRef = db.collection('admins').doc(uid);
    const userSnap = await userRef.get();
    const adminSnap = await adminRef.get();
    const userSchool = userSnap.exists ? userSnap.data()?.schoolId : undefined;
    const adminSchool = adminSnap.exists ? adminSnap.data()?.schoolId : undefined;
    const existingSchool =
      typeof userSchool === 'string' && userSchool
        ? userSchool
        : typeof adminSchool === 'string' && adminSchool
          ? adminSchool
          : undefined;

    if (existingSchool && existingSchool !== schoolId) {
      return NextResponse.json(
        { error: 'Your account is already linked to a different school.' },
        { status: 409 }
      );
    }

    if (existingSchool === schoolId) {
      await auth.setCustomUserClaims(uid, { schoolId });
      return NextResponse.json({
        success: true,
        schoolId,
        alreadyMember: true,
        tokenRefreshRecommended: true,
      });
    }

    const email = decoded.email || userSnap.data()?.email || adminSnap.data()?.email || '';

    await db.runTransaction(async (t) => {
      const freshInvite = await t.get(inviteRef);
      if (!freshInvite.exists) throw new Error('MISSING_INVITE');
      const d = freshInvite.data() as Record<string, unknown>;
      if (d.revoked === true || d.usedAt != null) throw new Error('INVITE_USED');
      const exp = d.expiresAt as Timestamp | undefined;
      if (exp && exp.toMillis() < Date.now()) throw new Error('INVITE_EXPIRED');

      const uSnap = await t.get(userRef);
      const aSnap = await t.get(adminRef);
      const curUserSchool = uSnap.exists ? uSnap.data()?.schoolId : undefined;
      const curAdminSchool = aSnap.exists ? aSnap.data()?.schoolId : undefined;
      const curEffective =
        typeof curUserSchool === 'string' && curUserSchool
          ? curUserSchool
          : typeof curAdminSchool === 'string' && curAdminSchool
            ? curAdminSchool
            : undefined;
      if (curEffective && curEffective !== schoolId) {
        throw new Error('WRONG_SCHOOL');
      }
      if (curEffective === schoolId) {
        return;
      }

      t.update(inviteRef, { usedAt: admin.firestore.FieldValue.serverTimestamp() });

      t.set(
        userRef,
        {
          schoolId,
          role: 'staff',
          email,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      t.set(
        adminRef,
        {
          schoolId,
          role: 'staff',
          email,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    await auth.setCustomUserClaims(uid, { schoolId });

    return NextResponse.json({
      success: true,
      schoolId,
      tokenRefreshRecommended: true,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '';
    if (msg === 'WRONG_SCHOOL') {
      return NextResponse.json(
        { error: 'Your account is already linked to a different school.' },
        { status: 409 }
      );
    }
    if (msg === 'INVITE_USED' || msg === 'INVITE_EXPIRED' || msg === 'MISSING_INVITE') {
      return NextResponse.json({ error: 'Invite is no longer valid' }, { status: 410 });
    }
    console.error('POST /api/schools/join:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

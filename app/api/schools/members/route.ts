import type { Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { admin, auth, db } from '@/lib/firebase-admin';
import { normalizeInviteEmail } from '@/lib/email-normalize';
import { getCallerSchoolId, getStaffRoleString } from '@/lib/server/school-staff-guard';
import { getPublicOriginFromRequest } from '@/lib/server/public-site-url';
import { isSchoolAdminRole } from '@/lib/staff-role';

export const dynamic = 'force-dynamic';

export type SchoolMemberRow = {
  uid: string;
  email: string;
  role: string | null;
  displayName: string | null;
};

export type PendingInviteRow = {
  email: string;
  expiresAtMs: number;
  /** Full join URL; only included for school admins. */
  joinUrl?: string;
};

type PendingInviteInternal = {
  email: string;
  expiresAtMs: number;
  token: string;
  emailNorm: string;
};

function pickMemberEmail(a: string, b: string): string {
  if (a && a !== '—') return a;
  if (b && b !== '—') return b;
  return a || b || '—';
}

function preferMemberRole(r1: string | null, r2: string | null): string | null {
  if (r1 === 'admin' || r2 === 'admin') return 'admin';
  if (r1) return r1;
  if (r2) return r2;
  return null;
}

function rowFromData(uid: string, data: Record<string, unknown>): SchoolMemberRow {
  const email = typeof data.email === 'string' ? data.email : '';
  const role = typeof data.role === 'string' ? data.role : null;
  const displayName = typeof data.displayName === 'string' ? data.displayName : null;
  return {
    uid,
    email: email || '—',
    role,
    displayName,
  };
}

function mergeMemberRows(a: SchoolMemberRow, b: SchoolMemberRow): SchoolMemberRow {
  return {
    uid: a.uid,
    email: pickMemberEmail(a.email, b.email),
    role: preferMemberRole(a.role, b.role),
    displayName: a.displayName?.trim() || b.displayName?.trim() || null,
  };
}

export async function GET(req: NextRequest) {
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
    const callerSchoolId = await getCallerSchoolId(uid);
    if (!callerSchoolId) {
      return NextResponse.json({ error: 'No school associated with this account' }, { status: 403 });
    }

    const snap = await db
      .collection('users')
      .where('schoolId', '==', callerSchoolId)
      .get();

    const byUid = new Map<string, SchoolMemberRow>();

    for (const d of snap.docs) {
      const data = d.data() as Record<string, unknown>;
      const email = typeof data.email === 'string' ? data.email : '';
      const role = typeof data.role === 'string' ? data.role : null;
      const displayName = typeof data.displayName === 'string' ? data.displayName : null;
      byUid.set(d.id, {
        uid: d.id,
        email: email || '—',
        role,
        displayName,
      });
    }

    const adminsSnap = await db
      .collection('admins')
      .where('schoolId', '==', callerSchoolId)
      .get();
    for (const d of adminsSnap.docs) {
      const data = d.data() as Record<string, unknown>;
      const fromAdmin = rowFromData(d.id, data);
      if (byUid.has(d.id)) {
        byUid.set(d.id, mergeMemberRows(byUid.get(d.id)!, fromAdmin));
      } else {
        byUid.set(d.id, fromAdmin);
      }
    }

    const schoolSnap = await db.collection('schools').doc(callerSchoolId).get();
    const school = schoolSnap.exists ? (schoolSnap.data() as Record<string, unknown>) : null;
    const billingOwnerUid =
      school &&
      typeof school.billingOwnerUid === 'string' &&
      (school.billingOwnerUid as string).trim()
        ? (school.billingOwnerUid as string).trim()
        : school && typeof school.createdBy === 'string' && (school.createdBy as string).trim()
          ? (school.createdBy as string).trim()
          : null;

    const members: SchoolMemberRow[] = Array.from(byUid.values()).map((m) => {
      if (m.role == null && billingOwnerUid && m.uid === billingOwnerUid) {
        return { ...m, role: 'admin' };
      }
      return m;
    });

    members.sort((a, b) => {
      const weight = (r: string | null) => (r === 'admin' ? 0 : 1);
      const ra = weight(a.role);
      const rb = weight(b.role);
      if (ra !== rb) return ra - rb;
      return a.email.localeCompare(b.email, undefined, { sensitivity: 'base' });
    });

    const memberEmails = new Set(
      members.map((m) => normalizeInviteEmail(m.email)).filter((e) => e && e !== '—')
    );

    const now = Date.now();
    const invitesSnap = await db
      .collection('schoolInvites')
      .where('schoolId', '==', callerSchoolId)
      .get();

    const pendingByEmail = new Map<string, PendingInviteInternal>();

    for (const d of invitesSnap.docs) {
      const data = d.data() as Record<string, unknown>;
      if (data.revoked === true) continue;
      if (data.usedAt != null) continue;
      const exp = data.expiresAt as Timestamp | undefined;
      const expMs = exp && typeof exp.toMillis === 'function' ? exp.toMillis() : 0;
      if (!expMs || expMs < now) continue;

      const raw =
        (typeof data.invitedEmail === 'string' && data.invitedEmail) ||
        (typeof data.invitedEmailNormalized === 'string' && data.invitedEmailNormalized) ||
        '';
      const em = raw.trim();
      if (!em) continue;

      const norm = normalizeInviteEmail(em);
      if (memberEmails.has(norm)) continue;

      const fromNorm =
        typeof data.invitedEmailNormalized === 'string' ? data.invitedEmailNormalized.trim() : '';
      const emailNorm = fromNorm || norm;
      const token = d.id;

      const next: PendingInviteInternal = { email: em, expiresAtMs: expMs, token, emailNorm };
      const existing = pendingByEmail.get(norm);
      if (!existing || expMs > existing.expiresAtMs) {
        pendingByEmail.set(norm, next);
      }
    }

    const callerIsSchoolAdmin = isSchoolAdminRole(await getStaffRoleString(uid));
    const publicOrigin = getPublicOriginFromRequest(req);

    const pendingInvites: PendingInviteRow[] = Array.from(pendingByEmail.values())
      .map((p) => {
        const row: PendingInviteRow = { email: p.email, expiresAtMs: p.expiresAtMs };
        if (callerIsSchoolAdmin) {
          const joinPath = `/join?token=${encodeURIComponent(p.token)}&e=${encodeURIComponent(p.emailNorm)}`;
          row.joinUrl = publicOrigin ? `${publicOrigin}${joinPath}` : joinPath;
        }
        return row;
      })
      .sort((a, b) => a.email.localeCompare(b.email, undefined, { sensitivity: 'base' }));

    return NextResponse.json({
      members,
      pendingInvites,
      schoolId: callerSchoolId,
      billingOwnerUid: billingOwnerUid || null,
    });
  } catch (error) {
    console.error('GET /api/schools/members:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

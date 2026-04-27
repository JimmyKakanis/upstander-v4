import { NextRequest, NextResponse } from 'next/server';
import { admin, auth, db } from '@/lib/firebase-admin';
import { assertSchoolAdmin } from '@/lib/server/school-staff-guard';

export const dynamic = 'force-dynamic';

const DISPLAY_NAME_MAX = 200;

function getBillingOwnerUid(school: Record<string, unknown> | null): string | null {
  if (!school) return null;
  const a = school.billingOwnerUid;
  if (typeof a === 'string' && a.trim()) return a.trim();
  const b = school.createdBy;
  if (typeof b === 'string' && b.trim()) return b.trim();
  return null;
}

async function targetInSchool(
  targetUid: string,
  schoolId: string
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const u = await db.collection('users').doc(targetUid).get();
  const a = await db.collection('admins').doc(targetUid).get();
  const uSid = u.exists ? u.data()?.schoolId : undefined;
  const aSid = a.exists ? a.data()?.schoolId : undefined;
  if (uSid === schoolId || aSid === schoolId) return { ok: true };
  if (typeof uSid === 'string' || typeof aSid === 'string') {
    return { ok: false, status: 400, error: 'User is linked to a different school' };
  }
  return { ok: false, status: 404, error: 'User is not in this school' };
}

type RouteParams = { params: { targetUid: string } };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
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

    const callerUid = decoded.uid;
    const targetUid = typeof params?.targetUid === 'string' ? params.targetUid.trim() : '';
    if (!targetUid) {
      return NextResponse.json({ error: 'Invalid member' }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const schoolId = typeof body.schoolId === 'string' ? body.schoolId.trim() : '';
    if (!schoolId) {
      return NextResponse.json({ error: 'schoolId is required' }, { status: 400 });
    }

    const adm = await assertSchoolAdmin(callerUid, schoolId);
    if (!adm.ok) {
      return NextResponse.json({ error: adm.error }, { status: 403 });
    }

    const t = await targetInSchool(targetUid, schoolId);
    if (!t.ok) {
      return NextResponse.json({ error: t.error }, { status: t.status });
    }

    const hasDisplay = 'displayName' in body;
    const hasRole = 'role' in body;
    if (!hasDisplay && !hasRole) {
      return NextResponse.json({ error: 'Provide displayName and/or role' }, { status: 400 });
    }

    const schoolSnap = await db.collection('schools').doc(schoolId).get();
    const school = schoolSnap.exists ? (schoolSnap.data() as Record<string, unknown>) : null;
    const billingOwner = getBillingOwnerUid(school);

    let nextDisplay: string | undefined;
    if (hasDisplay) {
      if (body.displayName !== null && typeof body.displayName !== 'string') {
        return NextResponse.json({ error: 'displayName must be a string' }, { status: 400 });
      }
      const raw = body.displayName === null ? '' : (body.displayName as string);
      const trimmed = raw.trim();
      if (trimmed.length > DISPLAY_NAME_MAX) {
        return NextResponse.json({ error: 'Name is too long' }, { status: 400 });
      }
      nextDisplay = trimmed;
    }

    let nextRole: 'admin' | 'teacher' | undefined;
    if (hasRole) {
      const r = body.role;
      if (r !== 'admin' && r !== 'teacher') {
        return NextResponse.json(
          { error: 'role must be admin or teacher' },
          { status: 400 }
        );
      }
      if (r === 'teacher' && billingOwner && targetUid === billingOwner) {
        return NextResponse.json(
          { error: 'The school billing account must remain a school admin' },
          { status: 400 }
        );
      }
      nextRole = r;
    }

    const ts = admin.firestore.FieldValue.serverTimestamp();
    const userRef = db.collection('users').doc(targetUid);
    const adminRef = db.collection('admins').doc(targetUid);
    const userSnap = await userRef.get();
    const adminSnap = await adminRef.get();

    const uOk = userSnap.exists && userSnap.data()?.schoolId === schoolId;
    const aOk = adminSnap.exists && adminSnap.data()?.schoolId === schoolId;
    if (!uOk && !aOk) {
      return NextResponse.json({ error: 'User is not in this school' }, { status: 404 });
    }

    const base: Record<string, unknown> = { updatedAt: ts };
    if (nextDisplay !== undefined) base.displayName = nextDisplay;
    if (nextRole) base.role = nextRole;

    if (uOk) {
      await userRef.set(base, { merge: true });
    }
    if (aOk) {
      await adminRef.set(base, { merge: true });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('PATCH /api/schools/members/[targetUid]:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
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

    const callerUid = decoded.uid;
    const targetUid = typeof params?.targetUid === 'string' ? params.targetUid.trim() : '';
    if (!targetUid) {
      return NextResponse.json({ error: 'Invalid member' }, { status: 400 });
    }

    const schoolId = req.nextUrl.searchParams.get('schoolId')?.trim() || '';
    if (!schoolId) {
      return NextResponse.json({ error: 'schoolId is required' }, { status: 400 });
    }

    const adm = await assertSchoolAdmin(callerUid, schoolId);
    if (!adm.ok) {
      return NextResponse.json({ error: adm.error }, { status: 403 });
    }

    const schoolSnap = await db.collection('schools').doc(schoolId).get();
    const school = schoolSnap.exists ? (schoolSnap.data() as Record<string, unknown>) : null;
    const billingOwner = getBillingOwnerUid(school);
    if (billingOwner && targetUid === billingOwner) {
      return NextResponse.json(
        { error: 'The billing owner account cannot be removed from the school' },
        { status: 400 }
      );
    }

    const t = await targetInSchool(targetUid, schoolId);
    if (!t.ok) {
      return NextResponse.json({ error: t.error }, { status: t.status });
    }

    const fv = admin.firestore.FieldValue;
    const userRef = db.collection('users').doc(targetUid);
    const adminRef = db.collection('admins').doc(targetUid);
    const userSnap = await userRef.get();
    const adminSnap = await adminRef.get();

    const updates = {
      schoolId: fv.delete(),
      role: fv.delete(),
      updatedAt: fv.serverTimestamp(),
    };

    if (userSnap.exists && userSnap.data()?.schoolId === schoolId) {
      await userRef.update(updates);
    }
    if (adminSnap.exists && adminSnap.data()?.schoolId === schoolId) {
      await adminRef.update(updates);
    }

    try {
      await auth.setCustomUserClaims(targetUid, {});
    } catch (claimsErr) {
      console.error('setCustomUserClaims after member remove:', claimsErr);
    }

    return NextResponse.json({ success: true, tokenRefreshRecommended: true });
  } catch (e) {
    console.error('DELETE /api/schools/members/[targetUid]:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

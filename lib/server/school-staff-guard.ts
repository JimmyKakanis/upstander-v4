import { db } from '@/lib/firebase-admin';
import { isSchoolAdminRole } from '@/lib/staff-role';

export async function getCallerSchoolId(uid: string): Promise<string | null> {
  const userSnap = await db.collection('users').doc(uid).get();
  let sid: string | undefined =
    userSnap.exists && typeof userSnap.data()?.schoolId === 'string'
      ? userSnap.data()!.schoolId
      : undefined;
  if (!sid) {
    const adminSnap = await db.collection('admins').doc(uid).get();
    if (adminSnap.exists && typeof adminSnap.data()?.schoolId === 'string') {
      sid = adminSnap.data()!.schoolId;
    }
  }
  return sid || null;
}

export async function getStaffRoleString(uid: string): Promise<string | null> {
  const userSnap = await db.collection('users').doc(uid).get();
  let r: string | null = null;
  if (userSnap.exists) {
    const v = userSnap.data()?.role;
    r = typeof v === 'string' ? v : null;
  }
  if (!r) {
    const adminSnap = await db.collection('admins').doc(uid).get();
    if (adminSnap.exists) {
      const v = adminSnap.data()?.role;
      r = typeof v === 'string' ? v : null;
    }
  }
  return r;
}

export async function assertSchoolAdmin(
  callerUid: string,
  schoolId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sid = await getCallerSchoolId(callerUid);
  if (typeof sid !== 'string' || sid !== schoolId) {
    return { ok: false, error: 'Forbidden' };
  }
  const role = await getStaffRoleString(callerUid);
  if (!isSchoolAdminRole(role)) {
    return { ok: false, error: 'Only a school admin can do this' };
  }
  return { ok: true };
}

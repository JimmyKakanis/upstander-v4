import type { StaffRole } from '@/types';

/**
 * Invited users are `teacher`. The account that registered the school is `admin`.
 * Legacy `staff` is treated the same as `teacher`.
 */
export function normalizeStaffRole(
  r: string | null | undefined
): StaffRole | undefined {
  if (r === 'admin') return 'admin';
  if (r === 'teacher' || r === 'staff') return 'teacher';
  return undefined;
}

/**
 * School admins can invite staff and manage billing. Invited teachers cannot.
 * Accounts with no `role` set (legacy) keep full access so existing schools are not locked out.
 */
export function isSchoolAdminRole(r: string | null | undefined): boolean {
  if (r == null || r === '') return true;
  if (r === 'admin') return true;
  if (r === 'teacher' || r === 'staff') return false;
  return true;
}

export function staffRoleLabel(r: string | null | undefined): string {
  if (r === 'admin') return 'School admin';
  if (r === 'teacher' || r === 'staff') return 'Teacher';
  return r?.trim() ? r : '—';
}

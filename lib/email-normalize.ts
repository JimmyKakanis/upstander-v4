/** Lowercase trim for invite matching (Firebase Auth emails are case-insensitive). */
export function normalizeInviteEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

const SIMPLE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidInviteEmail(raw: string): boolean {
  const s = raw.trim();
  return s.length <= 320 && SIMPLE_EMAIL.test(s);
}

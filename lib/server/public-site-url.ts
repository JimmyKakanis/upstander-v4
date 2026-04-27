import type { NextRequest } from 'next/server';

/**
 * No trailing slash. Used in API routes to build absolute links (emails, copy-invite, etc.).
 * Prefer `NEXT_PUBLIC_BASE_URL` in production, e.g. `https://upstander.help`.
 */
export function getPublicOriginFromRequest(req: NextRequest): string {
  const fromEnv = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '').trim();
  if (fromEnv) return fromEnv;

  const originHeader = (req.headers.get('origin') || '').replace(/\/$/, '').trim();
  if (originHeader.startsWith('http')) return originHeader;

  try {
    const o = req.nextUrl?.origin;
    if (o && o !== 'null' && /^https?:\/\//.test(o)) {
      return o.replace(/\/$/, '');
    }
  } catch {
    // ignore
  }

  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '')
    .split(',')[0]
    .trim();
  if (!host) return '';

  const firstHost = host.split(':')[0];
  const isLocal =
    firstHost === 'localhost' || firstHost === '127.0.0.1' || firstHost.endsWith('.local');
  const proto = (req.headers.get('x-forwarded-proto') || (isLocal ? 'http' : 'https'))
    .split(',')[0]
    .trim();
  return `${proto}://${host}`.replace(/\/$/, '');
}

// Staff authentication helpers. Clients are never authenticated (they access
// their order via an opaque trackToken). See CLAUDE.md §4 and §9.
import bcrypt from 'bcryptjs';
import type { Cookies } from '@sveltejs/kit';
import type { SessionUser } from '$lib/types';

export const SESSION_COOKIE = 'session';

// httpOnly + secure + SameSite=Lax session cookie (CLAUDE.md §9).
export const SESSION_COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 8 // 8h
};

const BCRYPT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Resolve the authenticated staff user from the session cookie.
 *
 * TODO (M1 — auth): back this with a server-side session store. Read the
 * opaque session token, look it up, load the StaffUser, and return its role +
 * tenantId. Anonymous requests (no cookie) return null with no DB hit, so
 * public client pages stay DB-light until they actually query.
 */
export async function resolveSessionUser(cookies: Cookies): Promise<SessionUser | null> {
  const token = cookies.get(SESSION_COOKIE);
  if (!token) return null;
  // Session store not implemented yet — see TODO above.
  return null;
}

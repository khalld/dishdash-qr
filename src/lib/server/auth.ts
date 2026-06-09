// Staff authentication helpers. Clients are never authenticated (they access
// their order via an opaque trackToken). See CLAUDE.md §4 and §9.
import bcrypt from 'bcryptjs';
import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { connectDb } from '$lib/server/db';
import { StaffUser, Session } from '$lib/server/models';
import { opaqueToken } from '$lib/server/tokens';
import type { SessionUser, StaffRole } from '$lib/types';

export const SESSION_COOKIE = 'session';

const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8h

// httpOnly + secure + SameSite=Lax session cookie (CLAUDE.md §9). `secure` is
// relaxed in dev so the cookie is accepted over plain http on localhost.
function cookieOptions() {
  return {
    path: '/',
    httpOnly: true,
    secure: !dev,
    sameSite: 'lax' as const,
    maxAge: Math.floor(SESSION_TTL_MS / 1000)
  };
}

/** Where each staff role lands after login (and where /login bounces them if
 * already authenticated). */
export function homeForRole(role: StaffRole): string {
  if (role === 'superuser') return '/admin/tenants';
  if (role === 'gestore') return '/gestore/coda';
  if (role === 'cameriere') return '/cameriere';
  return '/lavoratore';
}

const BCRYPT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Verify staff credentials. Returns the matching active StaffUser's id + role,
 * or null on any mismatch (unknown user, wrong password, deactivated account).
 * The work factor of bcrypt provides timing resistance.
 */
export async function authenticate(
  username: string,
  password: string
): Promise<{ id: string; role: StaffRole } | null> {
  await connectDb();
  const user = await StaffUser.findOne({ username, active: true });
  if (!user) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  return ok ? { id: String(user._id), role: user.role } : null;
}

/** Create a session for a user and set the cookie. Returns the session token. */
export async function createSession(cookies: Cookies, userId: string): Promise<string> {
  await connectDb();
  const token = opaqueToken(32);
  await Session.create({
    _id: token,
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS)
  });
  cookies.set(SESSION_COOKIE, token, cookieOptions());
  return token;
}

/** Destroy the current session (DB + cookie). Safe to call when not logged in. */
export async function destroySession(cookies: Cookies): Promise<void> {
  const token = cookies.get(SESSION_COOKIE);
  if (token) {
    await connectDb();
    await Session.deleteOne({ _id: token });
  }
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

/**
 * Resolve the authenticated staff user from the session cookie. Anonymous
 * requests (no cookie) return null with no DB hit, so public client pages stay
 * DB-light until they actually query. Expired/orphaned sessions also resolve to
 * null. The returned tenantId is authoritative for staff scoping.
 */
export async function resolveSessionUser(cookies: Cookies): Promise<SessionUser | null> {
  const token = cookies.get(SESSION_COOKIE);
  if (!token) return null;

  await connectDb();
  const session = await Session.findById(token).lean();
  if (!session || session.expiresAt.getTime() < Date.now()) return null;

  const user = await StaffUser.findById(session.userId).lean();
  if (!user || !user.active) return null;

  return {
    id: String(user._id),
    username: user.username,
    role: user.role,
    tenantId: user.tenantId ? String(user.tenantId) : null
  };
}

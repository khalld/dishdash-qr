// Top-down provisioning: tenants and staff accounts. There is no public sign-up
// (CLAUDE.md §3) — the superuser creates tenants/gestori/lavoratori, and a
// gestore may create only lavoratori of its own tenant. Initial passwords are
// generated server-side and returned once for display.
import { connectDb } from '$lib/server/db';
import { Tenant, StaffUser, type TenantDoc, type StaffUserDoc } from '$lib/server/models';
import { hashPassword } from '$lib/server/auth';
import { generateInitialPassword } from '$lib/server/tokens';
import type { StaffRole } from '$lib/types';

export interface TenantView {
  id: string;
  name: string;
  logoUrl: string | null;
  active: boolean;
  gestore: string; // gestore username, or "—" when none assigned yet
  workers: number;
}

export interface StaffRow {
  id: string;
  username: string;
  tenant: string; // tenant name, or "—" for the global superuser
  active: boolean;
}

/** Tenant cards for the superuser: each with its gestore and worker count. */
export async function listTenants(): Promise<TenantView[]> {
  await connectDb();
  const tenants = await Tenant.find().sort({ createdAt: 1 }).lean<TenantDoc[]>();
  return Promise.all(
    tenants.map(async (t) => {
      const id = String((t as TenantDoc & { _id: unknown })._id);
      const [gestore, workers] = await Promise.all([
        StaffUser.findOne({ tenantId: id, role: 'gestore' }).lean<StaffUserDoc>(),
        StaffUser.countDocuments({ tenantId: id, role: 'lavoratore' })
      ]);
      return {
        id,
        name: t.name,
        logoUrl: t.logoUrl ?? null,
        active: t.active,
        gestore: gestore?.username ?? '—',
        workers
      };
    })
  );
}

/** Lightweight tenant options for the create-gestore/lavoratore selects. */
export async function listTenantOptions(): Promise<{ id: string; name: string }[]> {
  await connectDb();
  const tenants = await Tenant.find().sort({ name: 1 }).lean<TenantDoc[]>();
  return tenants.map((t) => ({
    id: String((t as TenantDoc & { _id: unknown })._id),
    name: t.name
  }));
}

export async function createTenant(name: string): Promise<void> {
  await connectDb();
  await Tenant.create({ name });
}

/** All gestori across tenants (superuser view). */
export async function listGestori(): Promise<StaffRow[]> {
  await connectDb();
  const users = await StaffUser.find({ role: 'gestore' })
    .sort({ username: 1 })
    .lean<StaffUserDoc[]>();
  const tenants = await listTenantOptions();
  const nameById = new Map(tenants.map((t) => [t.id, t.name]));
  return users.map((u) => ({
    id: String((u as StaffUserDoc & { _id: unknown })._id),
    username: u.username,
    tenant: u.tenantId ? (nameById.get(String(u.tenantId)) ?? '—') : '—',
    active: u.active
  }));
}

/** Lavoratori, optionally scoped to one tenant (a gestore sees only its own). */
export async function listLavoratori(tenantId?: string): Promise<StaffRow[]> {
  await connectDb();
  const filter: Record<string, unknown> = { role: 'lavoratore' };
  if (tenantId) filter.tenantId = tenantId;
  const users = await StaffUser.find(filter).sort({ username: 1 }).lean<StaffUserDoc[]>();
  const tenants = await listTenantOptions();
  const nameById = new Map(tenants.map((t) => [t.id, t.name]));
  return users.map((u) => ({
    id: String((u as StaffUserDoc & { _id: unknown })._id),
    username: u.username,
    tenant: u.tenantId ? (nameById.get(String(u.tenantId)) ?? '—') : '—',
    active: u.active
  }));
}

export class DuplicateUsernameError extends Error {
  constructor(public username: string) {
    super(`Username già in uso: ${username}`);
    this.name = 'DuplicateUsernameError';
  }
}

/**
 * Create a gestore or lavoratore assigned to `tenantId`. Generates a one-time
 * initial password (returned plaintext for display). Throws
 * DuplicateUsernameError if the username is taken.
 */
export async function createStaffUser(input: {
  username: string;
  role: Exclude<StaffRole, 'superuser'>;
  tenantId: string;
}): Promise<{ username: string; initialPassword: string }> {
  await connectDb();
  const existing = await StaffUser.findOne({ username: input.username }).lean();
  if (existing) throw new DuplicateUsernameError(input.username);

  const initialPassword = generateInitialPassword();
  await StaffUser.create({
    username: input.username,
    role: input.role,
    tenantId: input.tenantId,
    passwordHash: await hashPassword(initialPassword),
    active: true
  });
  return { username: input.username, initialPassword };
}

/**
 * Reset a staff account's password to a fresh generated value (returned once).
 * Optionally scoped to a tenant so a gestore can only reset its own workers.
 * Returns null when no matching user is found.
 */
export async function resetStaffPassword(
  userId: string,
  scopeTenantId?: string
): Promise<{ username: string; initialPassword: string } | null> {
  await connectDb();
  const filter: Record<string, unknown> = { _id: userId };
  if (scopeTenantId) {
    filter.tenantId = scopeTenantId;
    filter.role = 'lavoratore';
  }
  const user = await StaffUser.findOne(filter);
  if (!user) return null;
  const initialPassword = generateInitialPassword();
  user.passwordHash = await hashPassword(initialPassword);
  await user.save();
  return { username: user.username, initialPassword };
}

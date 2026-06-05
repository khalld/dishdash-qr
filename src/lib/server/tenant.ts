// Tenant resolution + scoping. The tenant is NEVER taken from the request body
// (CLAUDE.md §9): for clients it derives from the QR token, for staff from the
// session. Cross-tenant access is only the superuser's prerogative.
import { error } from '@sveltejs/kit';
import { connectDb } from '$lib/server/db';
import { QrSource } from '$lib/server/models/qr-source';
import type { SessionUser } from '$lib/types';

export interface ResolvedQrTenant {
  tenantId: string;
  qrSource: { id: string; label: string };
}

/** Public client path: resolve the tenant from an opaque, active QR token. */
export async function resolveTenantFromQr(qrToken: string): Promise<ResolvedQrTenant> {
  await connectDb();
  const qr = await QrSource.findOne({ token: qrToken, active: true }).lean();
  if (!qr) throw error(404, 'QR non valido o disattivato');
  return {
    tenantId: String(qr.tenantId),
    qrSource: { id: String(qr._id), label: qr.label }
  };
}

/** Staff path: the tenant is the one carried by the authenticated session. */
export function requireStaffTenant(user: SessionUser | null): string {
  if (!user) throw error(401, 'Autenticazione richiesta');
  if (!user.tenantId) throw error(403, 'Operazione non disponibile per il superuser');
  return user.tenantId;
}

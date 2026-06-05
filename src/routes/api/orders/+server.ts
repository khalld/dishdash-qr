import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createOrderSchema } from '$lib/schemas';

// Public order-creation endpoint (anti-spam rate limiting + full logic: M5).
// Demonstrates the server boundary: validate with Zod, then resolve the tenant
// and recompute prices SERVER-SIDE from the qrToken — never trust client prices
// or tenantId (CLAUDE.md §8). Idempotency via createOrderSchema.idempotencyKey.
export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    throw error(400, 'Dati ordine non validi');
  }

  // TODO (M5): resolveTenantFromQr(parsed.data.qrToken) → load menu items →
  // recompute unitPrice/total server-side → check availability/stock →
  // upsert by (tenantId, idempotencyKey) → persist as IN_ATTESA with a fresh
  // opaque trackToken → return { trackToken }.
  throw error(501, 'Creazione ordine non ancora implementata (milestone M5)');
};

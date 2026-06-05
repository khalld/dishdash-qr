import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireStaffTenant } from '$lib/server/tenant';
import { listWorkQueue } from '$lib/server/repositories/order-repository';
import { transitionOrder } from '$lib/server/domain/order-service';
import type { OrderStatus } from '$lib/types';

// Worker preparation queue: confirmed / in-prep / ready orders of the worker's
// tenant (from the session). Workers only ever see orders already confirmed by
// the gestore (CLAUDE.md §3). The page polls this load for live updates.
export const load: PageServerLoad = async ({ locals }) => {
  const tenantId = requireStaffTenant(locals.user);
  return { orders: await listWorkQueue(tenantId) };
};

async function advance(
  locals: App.Locals,
  request: Request,
  to: OrderStatus
): Promise<{ ok: true } | ReturnType<typeof fail>> {
  const tenantId = requireStaffTenant(locals.user);
  const form = await request.formData();
  try {
    await transitionOrder({
      orderId: String(form.get('orderId') ?? ''),
      tenantId,
      to,
      actor: 'lavoratore'
    });
  } catch {
    return fail(409, { error: 'Lo stato della comanda è cambiato.' });
  }
  return { ok: true };
}

export const actions: Actions = {
  // CONFERMATA → IN_PREPARAZIONE
  take: ({ locals, request }) => advance(locals, request, 'IN_PREPARAZIONE'),
  // IN_PREPARAZIONE → PRONTA
  ready: ({ locals, request }) => advance(locals, request, 'PRONTA'),
  // PRONTA → CONSEGNATA
  deliver: ({ locals, request }) => advance(locals, request, 'CONSEGNATA')
};

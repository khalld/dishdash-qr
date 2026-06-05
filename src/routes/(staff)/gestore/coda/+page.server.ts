import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireStaffTenant } from '$lib/server/tenant';
import { listTodayOrders } from '$lib/server/repositories/order-repository';
import { transitionOrder } from '$lib/server/domain/order-service';

// Manager order queue, scoped to the gestore's tenant (from the session, never
// the request). The page polls this load for live updates.
export const load: PageServerLoad = async ({ locals }) => {
  const tenantId = requireStaffTenant(locals.user);
  return { orders: await listTodayOrders(tenantId) };
};

function orderId(form: FormData): string {
  return String(form.get('orderId') ?? '');
}

export const actions: Actions = {
  // Confirm: IN_ATTESA → CONFERMATA. Assigns the daily progressive number and
  // decrements stock atomically inside the service (CLAUDE.md §7).
  confirm: async ({ locals, request }) => {
    const tenantId = requireStaffTenant(locals.user);
    const form = await request.formData();
    try {
      await transitionOrder({
        orderId: orderId(form),
        tenantId,
        to: 'CONFERMATA',
        actor: 'gestore'
      });
    } catch {
      return fail(409, { error: 'Impossibile confermare: lo stato è cambiato.' });
    }
    return { ok: true };
  },
  // Reject: IN_ATTESA → RIFIUTATA.
  reject: async ({ locals, request }) => {
    const tenantId = requireStaffTenant(locals.user);
    const form = await request.formData();
    try {
      await transitionOrder({
        orderId: orderId(form),
        tenantId,
        to: 'RIFIUTATA',
        actor: 'gestore'
      });
    } catch {
      return fail(409, { error: 'Impossibile rifiutare: lo stato è cambiato.' });
    }
    return { ok: true };
  }
};

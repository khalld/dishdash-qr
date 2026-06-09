import { fail, type HttpError } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireStaffTenant } from '$lib/server/tenant';
import { Tenant } from '$lib/server/models';
import { listAvailableMenu } from '$lib/server/repositories/menu-repository';
import { listActiveQrSources, getActiveQrSource } from '$lib/server/repositories/qr-repository';
import { placeWaiterOrder } from '$lib/server/domain/order-service';
import { waiterPlaceOrderSchema } from '$lib/schemas';

// Cameriere order composer. The tenant comes from the session (never the
// request). Shows the available menu and the tenant's active QR sources so the
// waiter can pick a table/pickup point and compose an order on a guest's behalf.
export const load: PageServerLoad = async ({ locals }) => {
  const tenantId = requireStaffTenant(locals.user);
  const tenant = await Tenant.findById(tenantId).lean();
  const [menu, sources] = await Promise.all([
    listAvailableMenu(tenantId),
    listActiveQrSources(tenantId)
  ]);
  return {
    tenantName: tenant?.name ?? '',
    waiterOrdering: tenant?.waiterOrdering ?? false,
    menu,
    sources
  };
};

function httpErrorMessage(e: unknown, fallback: string): string {
  if (e && typeof e === 'object' && 'body' in e) {
    const body = (e as HttpError).body;
    if (body && typeof body === 'object' && 'message' in body) return String(body.message);
  }
  return fallback;
}

export const actions: Actions = {
  // Place + confirm a waiter order. Tenant, prices and availability are resolved
  // server-side; the source label is taken from the tenant's own QR source, not
  // the client. The order is created and immediately confirmed as the cameriere
  // (CONFERMATA, with its daily number) — see placeWaiterOrder (CLAUDE.md §3, §8).
  place: async ({ locals, request }) => {
    const tenantId = requireStaffTenant(locals.user);

    // The mode must be active for this tenant (server-side enforcement).
    const tenant = await Tenant.findById(tenantId).lean();
    if (!tenant?.waiterOrdering) {
      return fail(403, { error: 'La modalità cameriere non è attiva per questo locale.' });
    }

    const form = await request.formData();
    let parsedItems: unknown;
    try {
      parsedItems = JSON.parse(String(form.get('items') ?? '[]'));
    } catch {
      parsedItems = null;
    }

    const parsed = waiterPlaceOrderSchema.safeParse({
      qrSourceId: form.get('qrSourceId'),
      nickname: form.get('nickname'),
      items: parsedItems,
      idempotencyKey: form.get('idempotencyKey')
    });
    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Dati comanda non validi' });
    }

    // Resolve a server-trusted source label scoped to the tenant.
    const source = await getActiveQrSource(tenantId, parsed.data.qrSourceId);
    if (!source) return fail(400, { error: 'Tavolo o punto di ritiro non valido' });

    try {
      const order = await placeWaiterOrder({
        tenantId,
        qrSourceId: source.id,
        qrSourceLabel: source.label,
        // Nickname is optional for a waiter order — fall back to the source label.
        nickname: parsed.data.nickname.trim() || source.label,
        lines: parsed.data.items,
        idempotencyKey: parsed.data.idempotencyKey
      });
      return {
        placed: {
          number: order.number,
          nickname: order.nickname,
          source: order.source,
          total: order.total
        }
      };
    } catch (e) {
      return fail(409, { error: httpErrorMessage(e, 'Impossibile inviare la comanda. Riprova.') });
    }
  }
};

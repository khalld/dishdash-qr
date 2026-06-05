import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { resolveTenantFromQr } from '$lib/server/tenant';
import { listAvailableMenu } from '$lib/server/repositories/menu-repository';
import { placeOrder } from '$lib/server/repositories/order-repository';
import { Tenant } from '$lib/server/models';
import { createOrderSchema } from '$lib/schemas';

// Client menu page. The tenant is derived from the opaque qrToken — never from
// the client (CLAUDE.md §2). Only available items are shown.
export const load: PageServerLoad = async ({ params }) => {
  const { tenantId, qrSource } = await resolveTenantFromQr(params.qrToken);
  const tenant = await Tenant.findById(tenantId).lean();
  const menu = await listAvailableMenu(tenantId);

  return {
    tenant: { name: tenant?.name ?? '', logoUrl: tenant?.logoUrl ?? null },
    qrSource,
    menu
  };
};

export const actions: Actions = {
  // Place the order. Tenant + prices + availability are resolved/recomputed
  // SERVER-SIDE from the qrToken (CLAUDE.md §8); the client only sends item ids,
  // quantities, a nickname and an idempotency key. On success we redirect to the
  // tokenized tracking page.
  place: async ({ params, request }) => {
    const form = await request.formData();
    let parsedItems: unknown;
    try {
      parsedItems = JSON.parse(String(form.get('items') ?? '[]'));
    } catch {
      parsedItems = null;
    }

    const parsed = createOrderSchema.safeParse({
      qrToken: params.qrToken,
      nickname: form.get('nickname'),
      items: parsedItems,
      idempotencyKey: form.get('idempotencyKey')
    });
    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Dati ordine non validi' });
    }

    const { tenantId, qrSource } = await resolveTenantFromQr(parsed.data.qrToken);
    const order = await placeOrder({
      tenantId,
      qrSourceId: qrSource.id,
      qrSourceLabel: qrSource.label,
      nickname: parsed.data.nickname,
      lines: parsed.data.items,
      idempotencyKey: parsed.data.idempotencyKey
    });

    throw redirect(303, `/ordine/${order.trackToken}`);
  }
};

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { connectDb } from '$lib/server/db';
import { Order } from '$lib/server/models';
import type { OrderView } from '$lib/types';

// Client order tracking. The opaque trackToken is the only credential the
// client has (no login). The token uniquely identifies the order and, with it,
// the tenant — so no extra tenant scoping is needed for a read-by-token.
export const load: PageServerLoad = async ({ params }) => {
  await connectDb();
  const order = await Order.findOne({ trackToken: params.trackToken }).lean();
  if (!order) throw error(404, 'Comanda non trovata');

  const view: OrderView = {
    id: String(order._id),
    trackToken: order.trackToken,
    nickname: order.nickname,
    status: order.status,
    number: order.number,
    items: order.items.map((i) => ({
      menuItemId: String(i.menuItemId),
      name: i.name,
      qty: i.qty,
      unitPrice: i.unitPrice,
      notes: i.notes ?? ''
    })),
    total: order.total,
    createdAt:
      order.createdAt instanceof Date ? order.createdAt.toISOString() : String(order.createdAt)
  };

  return { order: view };
};

// Order data access. EVERY query is scoped by tenantId (CLAUDE.md §2, §9), with
// the sole exception of read-by-trackToken: the opaque token uniquely identifies
// one order (and thus its tenant), which is the only credential the anonymous
// client holds. Status is NEVER written here — transitions go through
// order-service.ts / the state machine (CLAUDE.md §7).
import { error } from '@sveltejs/kit';
import { connectDb } from '$lib/server/db';
import { Order, MenuItem, type OrderDoc } from '$lib/server/models';
import { opaqueToken } from '$lib/server/tokens';
import { computeTotal } from '$lib/server/domain/pricing';
import type { OrderView } from '$lib/types';
import type { HydratedDocument } from 'mongoose';

/** Map an Order document (lean or hydrated) to a plain, serializable view. */
export function toOrderView(o: OrderDoc & { _id: unknown }): OrderView {
  const createdAt = o.createdAt ?? new Date();
  const updatedAt = o.updatedAt ?? createdAt;
  return {
    id: String(o._id),
    trackToken: o.trackToken,
    nickname: o.nickname,
    source: o.qrSource?.label ?? '',
    status: o.status,
    number: o.number,
    items: o.items.map((i) => ({
      menuItemId: String(i.menuItemId),
      name: i.name,
      qty: i.qty,
      unitPrice: i.unitPrice,
      notes: i.notes ?? ''
    })),
    total: o.total,
    createdAt: createdAt instanceof Date ? createdAt.toISOString() : String(createdAt),
    updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : String(updatedAt)
  };
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** All of today's orders for a tenant (newest first) — feeds the manager queue
 * and the daily report. Bounded to the current day, matching the daily reset of
 * order numbering. */
export async function listTodayOrders(tenantId: string): Promise<OrderView[]> {
  await connectDb();
  const docs = await Order.find({ tenantId, createdAt: { $gte: startOfToday() } })
    .sort({ createdAt: -1 })
    .lean<OrderDoc[]>();
  return docs.map((d) => toOrderView(d as OrderDoc & { _id: unknown }));
}

/** Orders the worker can act on: confirmed/in-prep/ready, ordered by number. */
export async function listWorkQueue(tenantId: string): Promise<OrderView[]> {
  await connectDb();
  const docs = await Order.find({
    tenantId,
    status: { $in: ['CONFERMATA', 'IN_PREPARAZIONE', 'PRONTA'] }
  })
    .sort({ number: 1 })
    .lean<OrderDoc[]>();
  return docs.map((d) => toOrderView(d as OrderDoc & { _id: unknown }));
}

/** Read a single order by its opaque tracking token (customer tracking page). */
export async function getOrderByTrackToken(trackToken: string): Promise<OrderView> {
  await connectDb();
  const doc = await Order.findOne({ trackToken }).lean<OrderDoc>();
  if (!doc) throw error(404, 'Comanda non trovata');
  return toOrderView(doc as OrderDoc & { _id: unknown });
}

export interface PlaceOrderInput {
  tenantId: string;
  qrSourceId: string;
  qrSourceLabel: string;
  nickname: string;
  lines: { menuItemId: string; qty: number; notes: string }[];
  idempotencyKey: string;
}

/**
 * Create an IN_ATTESA order. Prices and availability are recomputed SERVER-SIDE
 * from the tenant's own menu — the client never supplies prices (CLAUDE.md §8).
 * Idempotent on (tenantId, idempotencyKey): a duplicate submission returns the
 * already-created order instead of a second one.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<OrderView> {
  await connectDb();

  const existing = await Order.findOne({
    tenantId: input.tenantId,
    idempotencyKey: input.idempotencyKey
  }).lean<OrderDoc>();
  if (existing) return toOrderView(existing as OrderDoc & { _id: unknown });

  const ids = input.lines.map((l) => l.menuItemId);
  const menuItems = await MenuItem.find({
    tenantId: input.tenantId,
    _id: { $in: ids },
    available: true
  }).lean();
  const byId = new Map(menuItems.map((m) => [String(m._id), m]));

  const items = input.lines.map((l) => {
    const m = byId.get(l.menuItemId);
    if (!m) throw error(409, 'Un elemento del carrello non è più disponibile. Aggiorna il menu.');
    return {
      menuItemId: m._id,
      name: m.name,
      qty: l.qty,
      unitPrice: m.price, // captured at order time (CLAUDE.md §6)
      notes: l.notes
    };
  });

  const total = computeTotal(items.map((i) => ({ unitPrice: i.unitPrice, qty: i.qty })));

  try {
    const doc = (await Order.create({
      tenantId: input.tenantId,
      trackToken: opaqueToken(),
      nickname: input.nickname,
      qrSource: { id: input.qrSourceId, label: input.qrSourceLabel },
      items,
      total,
      status: 'IN_ATTESA',
      idempotencyKey: input.idempotencyKey
    })) as HydratedDocument<OrderDoc>;
    return toOrderView(doc.toObject() as OrderDoc & { _id: unknown });
  } catch (e) {
    // Lost an idempotency race: the unique (tenantId, idempotencyKey) index
    // rejected the second insert — return the winner.
    if (e && typeof e === 'object' && 'code' in e && (e as { code: number }).code === 11000) {
      const again = await Order.findOne({
        tenantId: input.tenantId,
        idempotencyKey: input.idempotencyKey
      }).lean<OrderDoc>();
      if (again) return toOrderView(again as OrderDoc & { _id: unknown });
    }
    throw e;
  }
}

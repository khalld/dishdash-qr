// Order transitions — the single server entry point for moving an order through
// its lifecycle. Wires the state machine (order-state.ts), atomic numbering
// (numbering.ts) and persistence together, and enforces tenant ownership.
// Routes call THIS, never Order.status writes directly (CLAUDE.md §7).
import { error } from '@sveltejs/kit';
import { connectDb } from '$lib/server/db';
import { Order, MenuItem, type OrderDoc, type OrderItemDoc } from '$lib/server/models';
import { assertTransition } from '$lib/server/domain/order-state';
import { nextOrderNumber } from '$lib/server/domain/numbering';
import {
  placeOrder,
  toOrderView,
  type PlaceOrderInput
} from '$lib/server/repositories/order-repository';
import type { Actor, OrderStatus, OrderView } from '$lib/types';

interface TransitionInput {
  orderId: string;
  tenantId: string;
  to: OrderStatus;
  actor: Actor;
}

/**
 * Apply a staff transition to an order of `tenantId`. Validates (from, to, actor)
 * through the state machine, then commits with a guard on the current status so
 * concurrent actors can't double-apply. On IN_ATTESA → CONFERMATA the daily,
 * per-tenant order number is reserved atomically (once) and stock decremented.
 */
export async function transitionOrder({
  orderId,
  tenantId,
  to,
  actor
}: TransitionInput): Promise<OrderView> {
  await connectDb();

  const current = await Order.findOne({ _id: orderId, tenantId }).lean<OrderDoc>();
  if (!current) throw error(404, 'Comanda non trovata');

  // Validates the source state AND the actor's role (throws if not allowed).
  assertTransition(current.status, to, actor);

  const now = new Date();
  const set: Record<string, unknown> = { status: to };
  if (to === 'CONFERMATA') {
    set.number = await nextOrderNumber(tenantId, now);
    set.confirmedAt = now;
  }
  if (to === 'PRONTA') set.readyAt = now;
  if (to === 'CONSEGNATA') set.deliveredAt = now;

  // Guard on the observed status so a racing transition can't apply twice.
  const updated = await Order.findOneAndUpdate(
    { _id: orderId, tenantId, status: current.status },
    { $set: set },
    { new: true }
  ).lean<OrderDoc>();
  if (!updated) throw error(409, 'Lo stato della comanda è cambiato, ricarica la pagina');

  if (to === 'CONFERMATA') await decrementStock(tenantId, current.items);

  return toOrderView(updated as OrderDoc & { _id: unknown });
}

/**
 * Waiter (cameriere) order: create the order and immediately confirm it as the
 * cameriere, so it skips the gestore pending queue and lands straight in the
 * worker queue (CONFERMATA, with its daily number). Prices/availability are
 * recomputed server-side by placeOrder; numbering + stock decrement happen in
 * transitionOrder. Idempotent: a duplicate submit returns the already-created
 * order without confirming twice.
 */
export async function placeWaiterOrder(input: PlaceOrderInput): Promise<OrderView> {
  const created = await placeOrder(input);
  // If a duplicate submission returned an order already past IN_ATTESA, the
  // confirmation already happened — return it as-is (don't reapply).
  if (created.status !== 'IN_ATTESA') return created;
  return transitionOrder({
    orderId: created.id,
    tenantId: input.tenantId,
    to: 'CONFERMATA',
    actor: 'cameriere'
  });
}

/**
 * Customer cancellation by tracking token — allowed only while IN_ATTESA. The
 * token identifies the order (and its tenant); no session is involved.
 */
export async function cancelOrderByTrackToken(trackToken: string): Promise<OrderView> {
  await connectDb();

  const current = await Order.findOne({ trackToken }).lean<OrderDoc>();
  if (!current) throw error(404, 'Comanda non trovata');

  assertTransition(current.status, 'ANNULLATA', 'client');

  const updated = await Order.findOneAndUpdate(
    { trackToken, status: 'IN_ATTESA' },
    { $set: { status: 'ANNULLATA' } },
    { new: true }
  ).lean<OrderDoc>();
  if (!updated) throw error(409, 'La comanda non è più annullabile');

  return toOrderView(updated as OrderDoc & { _id: unknown });
}

/** Atomically decrement stock for items that track it (null stock = unlimited).
 * Availability concurrency control on confirm (CLAUDE.md §9). Best-effort:
 * unlimited items are skipped and confirmation is not blocked. */
async function decrementStock(tenantId: string, items: OrderItemDoc[]): Promise<void> {
  await Promise.all(
    items.map((i) =>
      MenuItem.updateOne(
        { _id: i.menuItemId, tenantId, stock: { $ne: null } },
        { $inc: { stock: -i.qty } }
      )
    )
  );
}

// Atomic, per-tenant, daily-reset order numbering (CLAUDE.md §7).
// The number is assigned exactly once, on IN_ATTESA → CONFERMATA.
import { Counter } from '$lib/server/models/counter';

// NOTE: the "day" is currently computed in UTC. When tenants span timezones,
// derive the day from the tenant's local timezone instead so the reset happens
// at local midnight. Tracked for post-MVP.
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function counterId(tenantId: string, date: Date): string {
  return `${tenantId}-order-number-${dayKey(date)}`;
}

/**
 * Atomically reserve the next progressive order number for a tenant on a given
 * day. Uses a single upserting $inc so concurrent confirmations never collide.
 */
export async function nextOrderNumber(tenantId: string, now: Date): Promise<number> {
  const _id = counterId(tenantId, now);
  const counter = await Counter.findByIdAndUpdate(
    _id,
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  // `new: true` guarantees a document; the post-increment value is the number.
  return counter?.seq ?? 1;
}

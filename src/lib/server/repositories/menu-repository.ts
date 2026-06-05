// Menu data access. EVERY query is scoped by tenantId (CLAUDE.md §2, §9).
// Repositories take the tenantId explicitly so callers must have resolved it
// from the session/QR — never from the request body.
import { connectDb } from '$lib/server/db';
import { MenuItem, type MenuItemDoc } from '$lib/server/models';
import type { MenuItemInput } from '$lib/schemas';
import type { MenuItemView } from '$lib/types';

function toView(d: MenuItemDoc & { _id: unknown }): MenuItemView {
  return {
    id: String(d._id),
    name: d.name,
    description: d.description ?? '',
    price: d.price,
    category: d.category ?? 'generale',
    available: d.available,
    imageUrl: d.imageUrl ?? null
  };
}

/** Available menu items for a tenant — the customer-facing menu. */
export async function listAvailableMenu(tenantId: string): Promise<MenuItemView[]> {
  await connectDb();
  const docs = await MenuItem.find({ tenantId, available: true })
    .sort({ category: 1, name: 1 })
    .lean<MenuItemDoc[]>();
  return docs.map((d) => toView(d as MenuItemDoc & { _id: unknown }));
}

/** All menu items for a tenant (available or not) — the manager's menu manager. */
export async function listAllMenu(tenantId: string): Promise<MenuItemView[]> {
  await connectDb();
  const docs = await MenuItem.find({ tenantId })
    .sort({ category: 1, name: 1 })
    .lean<MenuItemDoc[]>();
  return docs.map((d) => toView(d as MenuItemDoc & { _id: unknown }));
}

/** Create a menu item scoped to the tenant. */
export async function createMenuItem(
  tenantId: string,
  input: MenuItemInput
): Promise<MenuItemView> {
  await connectDb();
  const doc = await MenuItem.create({ tenantId, ...input });
  return toView(doc.toObject() as MenuItemDoc & { _id: unknown });
}

/**
 * Runtime availability toggle (the in/out-of-stock control). The server reads
 * the current value and inverts it, so the client only needs to identify the
 * item — no desired state to spoof. Scoped to the tenant so a manager can only
 * flip their own items. Returns false if no item matched.
 */
export async function toggleMenuItemAvailability(
  tenantId: string,
  itemId: string
): Promise<boolean> {
  await connectDb();
  const item = await MenuItem.findOne({ _id: itemId, tenantId }).lean<MenuItemDoc>();
  if (!item) return false;
  await MenuItem.updateOne({ _id: itemId, tenantId }, { $set: { available: !item.available } });
  return true;
}

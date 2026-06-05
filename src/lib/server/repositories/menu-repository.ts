// Example of the repository convention: EVERY query is scoped by tenantId
// (CLAUDE.md §2, §9). Repositories take the tenantId explicitly so callers must
// have resolved it from the session/QR — never from the request body.
import { connectDb } from '$lib/server/db';
import { MenuItem } from '$lib/server/models/menu-item';
import type { MenuItemView } from '$lib/types';

/** Available menu items for a tenant, as plain serializable views. */
export async function listAvailableMenu(tenantId: string): Promise<MenuItemView[]> {
  await connectDb();
  const docs = await MenuItem.find({ tenantId, available: true })
    .sort({ category: 1, name: 1 })
    .lean();

  return docs.map((d) => ({
    id: String(d._id),
    name: d.name,
    description: d.description ?? '',
    price: d.price,
    category: d.category ?? 'generale',
    available: d.available,
    imageUrl: d.imageUrl ?? null
  }));
}

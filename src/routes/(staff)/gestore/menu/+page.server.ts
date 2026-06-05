import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireStaffTenant } from '$lib/server/tenant';
import {
  listAllMenu,
  createMenuItem,
  toggleMenuItemAvailability
} from '$lib/server/repositories/menu-repository';
import { createMenuItemSchema } from '$lib/schemas';
import { parseEurosToCents } from '$lib/format';

// Manager menu manager — scoped to the gestore's tenant. Lists all items
// (available or not) and supports the runtime availability toggle + creation.
export const load: PageServerLoad = async ({ locals }) => {
  const tenantId = requireStaffTenant(locals.user);
  const menu = await listAllMenu(tenantId);
  const categories = [...new Set(menu.map((m) => m.category))];
  return { menu, categories };
};

export const actions: Actions = {
  // Runtime in/out-of-stock control. The server flips the current value.
  toggle: async ({ locals, request }) => {
    const tenantId = requireStaffTenant(locals.user);
    const form = await request.formData();
    const ok = await toggleMenuItemAvailability(tenantId, String(form.get('itemId') ?? ''));
    if (!ok) return fail(404, { error: 'Elemento non trovato' });
    return { ok: true };
  },

  // Create a menu item. Price arrives as a decimal string and is parsed to
  // integer cents server-side (CLAUDE.md §6) before validation.
  create: async ({ locals, request }) => {
    const tenantId = requireStaffTenant(locals.user);
    const form = await request.formData();
    const cents = parseEurosToCents(String(form.get('price') ?? ''));
    const parsed = createMenuItemSchema.safeParse({
      name: form.get('name'),
      description: form.get('description') ?? '',
      category: form.get('category'),
      price: cents ?? 0
    });
    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Dati non validi' });
    }
    await createMenuItem(tenantId, { ...parsed.data, available: true, stock: null });
    return { ok: true };
  }
};

import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireStaffTenant } from '$lib/server/tenant';
import { Tenant } from '$lib/server/models';
import {
  listCamerieri,
  createStaffUser,
  resetStaffPassword,
  toggleTenantWaiterOrdering,
  DuplicateUsernameError
} from '$lib/server/repositories/provisioning-repository';
import { createWorkerSchema } from '$lib/schemas';

// Gestore manages the camerieri of its OWN tenant (CLAUDE.md §3) and toggles the
// tenant's waiter-ordering mode. Scope is fixed to the session tenant.
export const load: PageServerLoad = async ({ locals }) => {
  const tenantId = requireStaffTenant(locals.user);
  const tenant = await Tenant.findById(tenantId).lean();
  return {
    camerieri: await listCamerieri(tenantId),
    tenantName: tenant?.name ?? '',
    waiterOrdering: tenant?.waiterOrdering ?? false
  };
};

export const actions: Actions = {
  // Flip waiter-ordering mode for the gestore's own tenant.
  toggleMode: async ({ locals }) => {
    const tenantId = requireStaffTenant(locals.user);
    const enabled = await toggleTenantWaiterOrdering(tenantId);
    if (enabled === null) return fail(404, { error: 'Tenant non trovato' });
    return { mode: { enabled } };
  },

  create: async ({ locals, request }) => {
    const tenantId = requireStaffTenant(locals.user);
    const form = await request.formData();
    const parsed = createWorkerSchema.safeParse({ username: form.get('username') });
    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Username non valido' });
    }
    try {
      const created = await createStaffUser({
        username: parsed.data.username,
        role: 'cameriere',
        tenantId
      });
      return { created };
    } catch (e) {
      if (e instanceof DuplicateUsernameError) {
        return fail(409, { error: 'Username già in uso' });
      }
      throw e;
    }
  },

  // Reset is scoped to the tenant + role so a gestore can only reset its own camerieri.
  resetPassword: async ({ locals, request }) => {
    const tenantId = requireStaffTenant(locals.user);
    const form = await request.formData();
    const reset = await resetStaffPassword(String(form.get('userId') ?? ''), {
      tenantId,
      role: 'cameriere'
    });
    if (!reset) return fail(404, { error: 'Cameriere non trovato' });
    return { reset };
  }
};

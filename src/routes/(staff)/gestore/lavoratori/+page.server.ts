import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireStaffTenant } from '$lib/server/tenant';
import { Tenant } from '$lib/server/models';
import {
  listLavoratori,
  createStaffUser,
  resetStaffPassword,
  DuplicateUsernameError
} from '$lib/server/repositories/provisioning-repository';
import { createWorkerSchema } from '$lib/schemas';

// Gestore creates the worker accounts of its OWN tenant (CLAUDE.md §3): it may
// not create gestori, and its scope is fixed to the session tenant.
export const load: PageServerLoad = async ({ locals }) => {
  const tenantId = requireStaffTenant(locals.user);
  const tenant = await Tenant.findById(tenantId).lean();
  return {
    workers: await listLavoratori(tenantId),
    tenantName: tenant?.name ?? ''
  };
};

export const actions: Actions = {
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
        role: 'lavoratore',
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

  // Reset is scoped to the tenant so a gestore can only reset its own workers.
  resetPassword: async ({ locals, request }) => {
    const tenantId = requireStaffTenant(locals.user);
    const form = await request.formData();
    const reset = await resetStaffPassword(String(form.get('userId') ?? ''), tenantId);
    if (!reset) return fail(404, { error: 'Lavoratore non trovato' });
    return { reset };
  }
};

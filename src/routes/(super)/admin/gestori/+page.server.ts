import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  listGestori,
  listTenantOptions,
  createStaffUser,
  resetStaffPassword,
  DuplicateUsernameError
} from '$lib/server/repositories/provisioning-repository';
import { provisionStaffSchema } from '$lib/schemas';

// Superuser creates gestori and assigns each to a specific tenant. Creating
// gestori is the superuser's exclusive prerogative (CLAUDE.md §3).
export const load: PageServerLoad = async () => {
  const [gestori, tenants] = await Promise.all([listGestori(), listTenantOptions()]);
  return { gestori, tenants };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const form = await request.formData();
    const parsed = provisionStaffSchema.safeParse({
      username: form.get('username'),
      tenantId: form.get('tenantId')
    });
    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Dati non validi' });
    }
    try {
      const created = await createStaffUser({
        username: parsed.data.username,
        role: 'gestore',
        tenantId: parsed.data.tenantId
      });
      return { created };
    } catch (e) {
      if (e instanceof DuplicateUsernameError) return fail(409, { error: 'Username già in uso' });
      throw e;
    }
  },

  resetPassword: async ({ request }) => {
    const form = await request.formData();
    const reset = await resetStaffPassword(String(form.get('userId') ?? ''));
    if (!reset) return fail(404, { error: 'Gestore non trovato' });
    return { reset };
  }
};

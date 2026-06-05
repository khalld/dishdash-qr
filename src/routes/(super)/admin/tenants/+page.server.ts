import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { listTenants, createTenant } from '$lib/server/repositories/provisioning-repository';
import { createTenantSchema } from '$lib/schemas';

// Superuser tenant management (global, cross-tenant). Lists tenants with their
// gestore + worker count, and creates new ones. The manager is associated in a
// later step (the Gestori tab).
export const load: PageServerLoad = async () => {
  return { tenants: await listTenants() };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const form = await request.formData();
    const parsed = createTenantSchema.safeParse({ name: form.get('name') });
    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Nome non valido' });
    }
    try {
      await createTenant(parsed.data.name);
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && (e as { code: number }).code === 11000) {
        return fail(409, { error: 'Esiste già un tenant con questo nome' });
      }
      throw e;
    }
    return { ok: true };
  }
};

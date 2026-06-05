import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// The superuser home is the tenants list.
export const load: PageServerLoad = () => {
  throw redirect(307, '/admin/tenants');
};

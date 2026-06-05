import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// Gestore area — authenticated, scoped to the gestore's own tenant. The tenant
// always comes from the session (locals.user.tenantId), never the request.
export const load: LayoutServerLoad = ({ locals }) => {
  if (!locals.user) throw redirect(303, '/login');
  if (locals.user.role !== 'gestore') throw error(403, 'Accesso riservato al gestore');
  return { user: locals.user };
};

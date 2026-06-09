import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// Cameriere area — authenticated, scoped to the waiter's own tenant. The tenant
// always comes from the session (locals.user.tenantId), never the request. The
// cameriere takes orders for guests and confirms them in waiter-ordering tenants
// (CLAUDE.md §3).
export const load: LayoutServerLoad = ({ locals }) => {
  if (!locals.user) throw redirect(303, '/login');
  if (locals.user.role !== 'cameriere') throw error(403, 'Accesso riservato al cameriere');
  return { user: locals.user };
};

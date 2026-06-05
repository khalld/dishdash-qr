import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// Lavoratore area — authenticated, scoped to the worker's own tenant. Workers
// only see orders already confirmed by the gestore (CLAUDE.md §3).
export const load: LayoutServerLoad = ({ locals }) => {
  if (!locals.user) throw redirect(303, '/login');
  if (locals.user.role !== 'lavoratore') throw error(403, 'Accesso riservato al lavoratore');
  return { user: locals.user };
};

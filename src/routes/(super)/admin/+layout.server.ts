import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// Superuser-only area (global, cross-tenant). Guard runs server-side for every
// nested route (CLAUDE.md §9).
export const load: LayoutServerLoad = ({ locals }) => {
  if (!locals.user) throw redirect(303, '/login');
  if (locals.user.role !== 'superuser') throw error(403, 'Accesso riservato al superuser');
  return { user: locals.user };
};

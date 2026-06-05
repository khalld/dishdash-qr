import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// The gestore home is the order queue.
export const load: PageServerLoad = () => {
  throw redirect(307, '/gestore/coda');
};

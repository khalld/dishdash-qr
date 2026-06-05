import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { destroySession } from '$lib/server/auth';

// Logout is a POST (forms in the staff/admin navbars post here) so it can't be
// triggered by a cross-site GET. Destroys the session, clears the cookie, and
// returns the user to the login screen.
export const POST: RequestHandler = async ({ cookies }) => {
  await destroySession(cookies);
  throw redirect(303, '/login');
};

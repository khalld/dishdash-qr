import type { Handle } from '@sveltejs/kit';
import { resolveSessionUser } from '$lib/server/auth';

// Resolve the staff session once per request and expose it on locals. Anonymous
// requests (no session cookie) skip the DB entirely (see resolveSessionUser),
// so public client pages stay light. Route guards live in each group's
// +layout.server.ts. The DB connection is opened lazily by whatever first
// queries it (connectDb), so an unconfigured DB doesn't break the landing page.
export const handle: Handle = async ({ event, resolve }) => {
  event.locals.user = await resolveSessionUser(event.cookies);
  return resolve(event);
};

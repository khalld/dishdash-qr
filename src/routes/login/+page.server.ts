import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { staffLoginSchema } from '$lib/schemas';
import { authenticate, createSession, homeForRole } from '$lib/server/auth';

// Staff login. There is no public sign-up — accounts are provisioned top-down
// (CLAUDE.md §3). On success a server-side session is created and the cookie set,
// then the user is sent to their role's home.
export const load: PageServerLoad = ({ locals }) => {
  if (locals.user) throw redirect(303, homeForRole(locals.user.role));
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const form = await request.formData();
    const parsed = staffLoginSchema.safeParse({
      username: form.get('username'),
      password: form.get('password')
    });
    if (!parsed.success) {
      return fail(400, {
        username: String(form.get('username') ?? ''),
        error: 'Credenziali non valide'
      });
    }

    const account = await authenticate(parsed.data.username, parsed.data.password);
    if (!account) {
      // Same generic message whether the user is unknown or the password wrong.
      return fail(400, { username: parsed.data.username, error: 'Credenziali non valide' });
    }

    await createSession(cookies, account.id);
    throw redirect(303, homeForRole(account.role));
  }
};

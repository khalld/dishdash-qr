// See https://svelte.dev/docs/kit/types#app.d.ts
import type { SessionUser } from '$lib/types';

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      // Authenticated staff user resolved from the session cookie (null for
      // anonymous clients). The tenant for staff requests is ALWAYS taken from
      // here (user.tenantId), never from the request body. See CLAUDE.md §9.
      user: SessionUser | null;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};

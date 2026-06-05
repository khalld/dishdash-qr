import type { Actions, PageServerLoad } from './$types';
import { getOrderByTrackToken } from '$lib/server/repositories/order-repository';
import { cancelOrderByTrackToken } from '$lib/server/domain/order-service';

// Client order tracking. The opaque trackToken is the only credential the client
// has (no login). It uniquely identifies the order and, with it, the tenant — so
// no extra tenant scoping is needed for a read-by-token. The page polls this
// load to reflect staff progress live.
export const load: PageServerLoad = async ({ params }) => {
  return { order: await getOrderByTrackToken(params.trackToken) };
};

export const actions: Actions = {
  // Customer cancellation — allowed only while IN_ATTESA (enforced by the state
  // machine inside the service). Re-running load reflects the new status.
  cancel: async ({ params }) => {
    await cancelOrderByTrackToken(params.trackToken);
    return { ok: true };
  }
};

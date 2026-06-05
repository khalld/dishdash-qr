import type { PageServerLoad } from './$types';
import { resolveTenantFromQr } from '$lib/server/tenant';
import { listAvailableMenu } from '$lib/server/repositories/menu-repository';
import { Tenant } from '$lib/server/models';

// Client menu page. The tenant is derived from the opaque qrToken — never from
// the client (CLAUDE.md §2). Only available items are shown.
export const load: PageServerLoad = async ({ params }) => {
  const { tenantId, qrSource } = await resolveTenantFromQr(params.qrToken);
  const tenant = await Tenant.findById(tenantId).lean();
  const menu = await listAvailableMenu(tenantId);

  return {
    tenant: { name: tenant?.name ?? '', logoUrl: tenant?.logoUrl ?? null },
    qrSource,
    menu
  };
};

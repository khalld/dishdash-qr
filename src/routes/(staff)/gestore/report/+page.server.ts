import type { PageServerLoad } from './$types';
import { requireStaffTenant } from '$lib/server/tenant';
import { listTodayOrders } from '$lib/server/repositories/order-repository';
import { buildMonthlyReport } from '$lib/server/repositories/report-repository';

// Manager report, scoped to the tenant. Daily figures are derived from today's
// orders; the monthly aggregate is computed from delivered orders for the month.
export const load: PageServerLoad = async ({ locals }) => {
  const tenantId = requireStaffTenant(locals.user);
  const [orders, monthly] = await Promise.all([
    listTodayOrders(tenantId),
    buildMonthlyReport(tenantId)
  ]);
  return { orders, monthly };
};

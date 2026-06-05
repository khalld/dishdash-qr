// Report aggregation, scoped by tenantId (CLAUDE.md §2). The monthly figures are
// computed from the tenant's delivered orders for the period (not synthetic):
// per-day revenue, best sellers and the table/takeaway channel split.
import { connectDb } from '$lib/server/db';
import { Order, type OrderDoc } from '$lib/server/models';

const MONTHS = [
  'gennaio',
  'febbraio',
  'marzo',
  'aprile',
  'maggio',
  'giugno',
  'luglio',
  'agosto',
  'settembre',
  'ottobre',
  'novembre',
  'dicembre'
];
const MONTH_ABBR = [
  'gen',
  'feb',
  'mar',
  'apr',
  'mag',
  'giu',
  'lug',
  'ago',
  'set',
  'ott',
  'nov',
  'dic'
];
const WEEKDAYS = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];

export interface MonthlyDay {
  d: number;
  wd: string;
  weekend: boolean;
  orders: number;
  revenue: number; // cents
}

export interface MonthlyReport {
  label: string; // e.g. "giugno 2026"
  days: number;
  rows: MonthlyDay[];
  totalOrders: number;
  totalRevenue: number; // cents
  avgTicket: number; // cents
  best: { d: number; revenue: number; label: string };
  maxRev: number; // cents
  sellers: { name: string; qty: number; revenue: number }[];
  tavolo: number;
  asporto: number;
}

/** True when the order source looks like a takeaway/pickup spot. */
function isAsporto(label: string): boolean {
  return label.toLowerCase().includes('asport');
}

/** Aggregate the tenant's delivered orders for the month containing `ref`. */
export async function buildMonthlyReport(
  tenantId: string,
  ref: Date = new Date()
): Promise<MonthlyReport> {
  await connectDb();
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const delivered = await Order.find({
    tenantId,
    status: 'CONSEGNATA',
    deliveredAt: { $gte: start, $lt: end }
  }).lean<OrderDoc[]>();

  const rows: MonthlyDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const wd = new Date(year, month, d).getDay();
    rows.push({ d, wd: WEEKDAYS[wd], weekend: wd === 5 || wd === 6, orders: 0, revenue: 0 });
  }

  const sellersMap = new Map<string, { name: string; qty: number; revenue: number }>();
  let asporto = 0;

  for (const o of delivered) {
    const day = (o.deliveredAt ?? o.createdAt ?? start).getDate();
    const row = rows[day - 1];
    if (row) {
      row.orders += 1;
      row.revenue += o.total;
    }
    if (isAsporto(o.qrSource?.label ?? '')) asporto += 1;
    for (const it of o.items) {
      const e = sellersMap.get(it.name) ?? { name: it.name, qty: 0, revenue: 0 };
      e.qty += it.qty;
      e.revenue += it.unitPrice * it.qty;
      sellersMap.set(it.name, e);
    }
  }

  const totalOrders = delivered.length;
  const totalRevenue = delivered.reduce((s, o) => s + o.total, 0);
  const avgTicket = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
  const maxRev = rows.reduce((m, r) => Math.max(m, r.revenue), 0);
  const bestRow = rows.reduce((a, b) => (b.revenue > a.revenue ? b : a), rows[0]);
  const sellers = [...sellersMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  return {
    label: `${MONTHS[month]} ${year}`,
    days: daysInMonth,
    rows,
    totalOrders,
    totalRevenue,
    avgTicket,
    best: {
      d: bestRow?.d ?? 0,
      revenue: bestRow?.revenue ?? 0,
      label: `${bestRow?.d ?? 0} ${MONTH_ABBR[month]}`
    },
    maxRev,
    sellers,
    tavolo: totalOrders - asporto,
    asporto
  };
}

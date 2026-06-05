// Shared domain types and enums. Importable from both client and server.
// The server is always the source of truth for tenant, prices and state
// (CLAUDE.md §8) — these types just describe the shapes.

export const ORDER_STATUSES = [
  'CARRELLO',
  'IN_ATTESA',
  'CONFERMATA',
  'IN_PREPARAZIONE',
  'PRONTA',
  'IN_CONSEGNA', // future delivery branch — predisposed, not used in the MVP
  'CONSEGNATA',
  'RIFIUTATA',
  'ANNULLATA'
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STAFF_ROLES = ['superuser', 'gestore', 'lavoratore'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

// Who can trigger an order transition. The anonymous client is not a StaffRole.
export type Actor = 'client' | StaffRole;

export const QR_SOURCE_TYPES = ['table', 'takeaway', 'cart', 'delivery'] as const;
export type QrSourceType = (typeof QR_SOURCE_TYPES)[number];

// Session payload attached to event.locals.user. tenantId is null only for the
// global superuser; gestore/lavoratore always carry their tenant.
export interface SessionUser {
  id: string;
  username: string;
  role: StaffRole;
  tenantId: string | null;
}

// Plain, serializable shapes returned by server `load` functions to the client.
export interface MenuItemView {
  id: string;
  name: string;
  description: string;
  price: number; // cents
  category: string;
  available: boolean;
  imageUrl: string | null;
}

export interface OrderItemView {
  menuItemId: string;
  name: string;
  qty: number;
  unitPrice: number; // cents, captured at order time
  notes: string;
}

export interface OrderView {
  id: string;
  trackToken: string;
  nickname: string;
  status: OrderStatus;
  number: number | null;
  items: OrderItemView[];
  total: number; // cents
  createdAt: string;
}

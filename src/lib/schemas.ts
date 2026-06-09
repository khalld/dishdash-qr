// Zod schemas for every input crossing the server boundary (CLAUDE.md §8).
// Shared so forms can reuse them, but the server is the enforcement point.
//
// The client never sends prices or tenantId: the server recomputes the total
// from its own menu prices and derives the tenant from the QR token.
import { z } from 'zod';
import { STAFF_ROLES, QR_SOURCE_TYPES } from '$lib/types';

export const staffLoginSchema = z.object({
  username: z.string().trim().min(1, 'Username obbligatorio').toLowerCase(),
  password: z.string().min(1, 'Password obbligatoria')
});
export type StaffLoginInput = z.infer<typeof staffLoginSchema>;

export const orderLineInputSchema = z.object({
  menuItemId: z.string().min(1),
  qty: z.number().int().min(1).max(99),
  notes: z.string().trim().max(280).default('')
});

export const createOrderSchema = z.object({
  // tenant + prices are resolved/recomputed server-side from qrToken.
  qrToken: z.string().min(1),
  nickname: z.string().trim().min(1, 'Nickname obbligatorio').max(40),
  items: z.array(orderLineInputSchema).min(1, 'Il carrello è vuoto'),
  // Idempotency key generated client-side to dedupe double submits (CLAUDE.md §8).
  idempotencyKey: z.string().min(8).max(128)
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// Waiter (cameriere) order: the tenant comes from the staff session, not the QR
// token, and the source is one of the tenant's own QR sources (resolved/labelled
// server-side). The nickname is optional — it falls back to the source label.
// Prices are recomputed server-side exactly like the self-order flow (CLAUDE.md §8).
export const waiterPlaceOrderSchema = z.object({
  qrSourceId: z.string().min(1, 'Seleziona un tavolo o punto di ritiro'),
  nickname: z.string().trim().max(40).default(''),
  items: z.array(orderLineInputSchema).min(1, 'Aggiungi almeno un articolo'),
  idempotencyKey: z.string().min(8).max(128)
});
export type WaiterPlaceOrderInput = z.infer<typeof waiterPlaceOrderSchema>;

export const menuItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).default(''),
  price: z.number().int().min(0), // cents
  category: z.string().trim().min(1).max(60).default('generale'),
  available: z.boolean().default(true),
  stock: z.number().int().min(0).nullable().default(null)
});
export type MenuItemInput = z.infer<typeof menuItemSchema>;

export const qrSourceSchema = z.object({
  label: z.string().trim().min(1).max(60),
  type: z.enum(QR_SOURCE_TYPES).default('table')
});
export type QrSourceInput = z.infer<typeof qrSourceSchema>;

// Superuser creates staff; gestore may only create lavoratori/camerieri of its
// tenant (enforced in the route, not here). 'superuser' is excluded as a
// creatable role.
export const createStaffSchema = z.object({
  username: z.string().trim().min(3).max(40).toLowerCase(),
  password: z.string().min(8).max(128),
  role: z.enum(STAFF_ROLES).refine((r) => r !== 'superuser', 'Ruolo non creabile')
});
export type CreateStaffInput = z.infer<typeof createStaffSchema>;

// Provisioning (no password fields: initial passwords are generated server-side
// and shown once). A username is lowercased and restricted to a safe charset.
const usernameField = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Username troppo corto')
  .max(40)
  .regex(/^[a-z0-9._-]+$/, 'Solo lettere, numeri, punto, trattino e underscore');

export const createTenantSchema = z.object({
  name: z.string().trim().min(1, 'Nome obbligatorio').max(120)
});
export type CreateTenantInput = z.infer<typeof createTenantSchema>;

// Superuser: create a gestore/lavoratore and assign to a chosen tenant.
export const provisionStaffSchema = z.object({
  username: usernameField,
  tenantId: z.string().min(1, 'Tenant obbligatorio')
});
export type ProvisionStaffInput = z.infer<typeof provisionStaffSchema>;

// Gestore: create a lavoratore of the OWN tenant (tenant comes from the session).
export const createWorkerSchema = z.object({
  username: usernameField
});
export type CreateWorkerInput = z.infer<typeof createWorkerSchema>;

// Manager menu item creation from the modal (price arrives as a decimal string
// like "5,00" and is parsed to integer cents before this schema validates).
export const createMenuItemSchema = z.object({
  name: z.string().trim().min(1, 'Nome obbligatorio').max(120),
  description: z.string().trim().max(500).default(''),
  category: z.string().trim().min(1).max(60),
  price: z.number().int().min(1, 'Prezzo non valido') // cents
});
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;

// Manager QR generation.
export const createQrSchema = z.object({
  label: z.string().trim().min(1).max(60),
  type: z.enum(QR_SOURCE_TYPES).default('table')
});

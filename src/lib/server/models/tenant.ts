import mongoose, { Schema, type Model } from 'mongoose';

export interface TenantDoc {
  name: string;
  logoUrl: string | null;
  active: boolean;
  // Waiter-ordering mode. When true, customers can only VIEW the menu via QR;
  // a 'cameriere' composes and confirms the order on their behalf (CLAUDE.md §3).
  // Default false = the standard self-order flow.
  waiterOrdering: boolean;
  settings: Record<string, unknown>;
}

const tenantSchema = new Schema<TenantDoc>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    logoUrl: { type: String, default: null },
    active: { type: Boolean, default: true },
    waiterOrdering: { type: Boolean, default: false },
    settings: { type: Object, default: {} }
  },
  { timestamps: true }
);

export const Tenant: Model<TenantDoc> =
  (mongoose.models.Tenant as Model<TenantDoc>) || mongoose.model<TenantDoc>('Tenant', tenantSchema);

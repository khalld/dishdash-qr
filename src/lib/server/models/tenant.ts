import mongoose, { Schema, type Model } from 'mongoose';

export interface TenantDoc {
  name: string;
  logoUrl: string | null;
  active: boolean;
  settings: Record<string, unknown>;
}

const tenantSchema = new Schema<TenantDoc>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    logoUrl: { type: String, default: null },
    active: { type: Boolean, default: true },
    settings: { type: Object, default: {} }
  },
  { timestamps: true }
);

export const Tenant: Model<TenantDoc> =
  (mongoose.models.Tenant as Model<TenantDoc>) || mongoose.model<TenantDoc>('Tenant', tenantSchema);

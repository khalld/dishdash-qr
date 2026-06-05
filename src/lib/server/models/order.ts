import mongoose, { Schema, type Model } from 'mongoose';
import { ORDER_STATUSES, type OrderStatus } from '$lib/types';

export interface OrderItemDoc {
  menuItemId: mongoose.Types.ObjectId;
  name: string; // snapshot at order time
  qty: number;
  unitPrice: number; // cents, captured at order time (CLAUDE.md §6)
  notes: string;
}

export interface OrderDoc {
  tenantId: mongoose.Types.ObjectId;
  trackToken: string; // opaque client tracking token
  nickname: string;
  qrSource: { id: mongoose.Types.ObjectId; label: string };
  items: OrderItemDoc[];
  total: number; // cents, recomputed server-side
  status: OrderStatus;
  number: number | null; // assigned atomically on confirmation, per tenant, daily
  rejectionReason: string | null;
  idempotencyKey: string | null; // dedupes order submission (CLAUDE.md §8)
  confirmedAt: Date | null;
  readyAt: Date | null;
  deliveredAt: Date | null;
  // Added by { timestamps: true } at runtime.
  createdAt?: Date;
  updatedAt?: Date;
}

const orderItemSchema = new Schema<OrderItemDoc>(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    notes: { type: String, default: '' }
  },
  { _id: false }
);

const orderSchema = new Schema<OrderDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    trackToken: { type: String, required: true, unique: true },
    nickname: { type: String, required: true, trim: true },
    qrSource: {
      id: { type: Schema.Types.ObjectId, ref: 'QrSource', required: true },
      label: { type: String, required: true }
    },
    items: { type: [orderItemSchema], default: [] },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: 'IN_ATTESA' },
    number: { type: Number, default: null },
    rejectionReason: { type: String, default: null },
    idempotencyKey: { type: String, default: null },
    confirmedAt: { type: Date, default: null },
    readyAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// Queue views are always scoped + filtered by status within a tenant.
orderSchema.index({ tenantId: 1, status: 1 });
// Idempotent submission: one order per (tenant, idempotencyKey) when present.
orderSchema.index(
  { tenantId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);

export const Order: Model<OrderDoc> =
  (mongoose.models.Order as Model<OrderDoc>) || mongoose.model<OrderDoc>('Order', orderSchema);

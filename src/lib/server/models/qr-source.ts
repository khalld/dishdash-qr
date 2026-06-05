import mongoose, { Schema, type Model } from 'mongoose';
import { QR_SOURCE_TYPES, type QrSourceType } from '$lib/types';

export interface QrSourceDoc {
  tenantId: mongoose.Types.ObjectId;
  token: string; // opaque, non-sequential (no enumeration) — CLAUDE.md §9
  label: string; // e.g. "Tavolo 5"
  type: QrSourceType;
  active: boolean;
}

const qrSourceSchema = new Schema<QrSourceDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    token: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    type: { type: String, enum: QR_SOURCE_TYPES, default: 'table' },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const QrSource: Model<QrSourceDoc> =
  (mongoose.models.QrSource as Model<QrSourceDoc>) ||
  mongoose.model<QrSourceDoc>('QrSource', qrSourceSchema);

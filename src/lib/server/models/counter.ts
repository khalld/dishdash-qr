import mongoose, { Schema, type Model } from 'mongoose';

// Atomic counters for per-tenant, per-day order numbering. The _id encodes the
// scope, e.g. "<tenantId>-order-number-2026-06-05" (see numbering.ts).
export interface CounterDoc {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<CounterDoc>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
  },
  { _id: false } // we provide our own string _id
);

export const Counter: Model<CounterDoc> =
  (mongoose.models.Counter as Model<CounterDoc>) ||
  mongoose.model<CounterDoc>('Counter', counterSchema);

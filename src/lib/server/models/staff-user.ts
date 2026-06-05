import mongoose, { Schema, type Model } from 'mongoose';
import { STAFF_ROLES, type StaffRole } from '$lib/types';

export interface StaffUserDoc {
  role: StaffRole;
  tenantId: mongoose.Types.ObjectId | null; // null only for the global superuser
  username: string;
  passwordHash: string;
  active: boolean;
}

const staffUserSchema = new Schema<StaffUserDoc>(
  {
    role: { type: String, enum: STAFF_ROLES, required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const StaffUser: Model<StaffUserDoc> =
  (mongoose.models.StaffUser as Model<StaffUserDoc>) ||
  mongoose.model<StaffUserDoc>('StaffUser', staffUserSchema);

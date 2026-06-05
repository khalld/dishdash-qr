import mongoose, { Schema, type Model } from 'mongoose';

// Server-side session store. The cookie carries only an opaque token (the _id);
// the role and tenantId are looked up from here + the StaffUser on each request,
// never trusted from the client (CLAUDE.md §9). A TTL index expires sessions
// automatically at `expiresAt`.
export interface SessionDoc {
  _id: string; // opaque session token (also the cookie value)
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
}

const sessionSchema = new Schema<SessionDoc>(
  {
    _id: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'StaffUser', required: true },
    expiresAt: { type: Date, required: true }
  },
  { _id: false, timestamps: true }
);

// MongoDB removes the document once `expiresAt` passes.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session: Model<SessionDoc> =
  (mongoose.models.Session as Model<SessionDoc>) ||
  mongoose.model<SessionDoc>('Session', sessionSchema);

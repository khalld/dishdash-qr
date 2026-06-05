import mongoose, { Schema, type Model } from 'mongoose';

export interface MenuItemDoc {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number; // cents, never float (CLAUDE.md §6)
  category: string;
  available: boolean; // runtime toggle by the gestore
  stock: number | null; // null = unlimited
  imageUrl: string | null;
  allergens: string[];
}

const menuItemSchema = new Schema<MenuItemDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, default: 'generale' },
    available: { type: Boolean, default: true },
    stock: { type: Number, default: null },
    imageUrl: { type: String, default: null },
    allergens: { type: [String], default: [] }
  },
  { timestamps: true }
);

export const MenuItem: Model<MenuItemDoc> =
  (mongoose.models.MenuItem as Model<MenuItemDoc>) ||
  mongoose.model<MenuItemDoc>('MenuItem', menuItemSchema);

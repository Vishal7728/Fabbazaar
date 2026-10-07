import mongoose, { Schema } from 'mongoose';
import type { ProductRecord } from '../data/seed';

const productSchema = new Schema<ProductRecord>({
  id: { type: String, required: true, unique: true, immutable: true },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  name: { type: String, required: true, trim: true, maxlength: 140 },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  collection: { type: String, enum: ['Rivaaz', 'Jaipuri Collection', 'Bazaar Exclusive'], default: 'Bazaar Exclusive', index: true },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, min: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviews: { type: Number, default: 0, min: 0 },
  colors: { type: [String], default: [] },
  sizes: { type: [String], default: [] },
  stock: { type: Number, default: 0, min: 0 },
  description: { type: String, required: true, trim: true, maxlength: 4000 },
  shortDescription: { type: String, required: true, trim: true, maxlength: 240 },
  image: { type: String, required: true, trim: true, maxlength: 2048 },
  gallery: { type: [String], default: [] },
  featured: { type: Boolean, default: false },
  newArrival: { type: Boolean, default: false },
  tags: { type: [String], default: [] }
}, { timestamps: true, versionKey: false, suppressReservedKeysWarning: true });

export const Product = mongoose.models.Product || mongoose.model<ProductRecord>('Product', productSchema);

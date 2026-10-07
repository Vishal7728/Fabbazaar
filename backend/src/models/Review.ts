import mongoose, { Schema } from 'mongoose';

const reviewSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, immutable: true },
  customerId: { type: String, required: true, immutable: true },
  productId: { type: String, required: true, immutable: true },
  productSlug: { type: String, required: true, immutable: true },
  productName: { type: String, required: true, immutable: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, minlength: 5, maxlength: 2000 }
}, { timestamps: true });

reviewSchema.index({ customer: 1, productId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, createdAt: -1 });

export const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

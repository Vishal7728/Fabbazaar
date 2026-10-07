import mongoose, { Schema } from 'mongoose';

export type PromotionRecord = {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minimumOrder: number;
  maximumDiscount: number | null;
  expiresAt: Date | null;
  active: boolean;
};

const promotionSchema = new Schema<PromotionRecord>({
  code: { type: String, required: true, unique: true, trim: true, uppercase: true, maxlength: 32 },
  type: { type: String, enum: ['percent', 'fixed'], required: true },
  value: { type: Number, required: true, min: 1 },
  minimumOrder: { type: Number, default: 0, min: 0 },
  maximumDiscount: { type: Number, default: null, min: 1 },
  expiresAt: { type: Date, default: null },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export const Promotion = (mongoose.models.Promotion as mongoose.Model<PromotionRecord> | undefined) || mongoose.model<PromotionRecord>('Promotion', promotionSchema);

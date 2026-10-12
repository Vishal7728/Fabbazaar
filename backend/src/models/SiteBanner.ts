import mongoose, { Schema } from 'mongoose';

export type HomepageBannerRecord = {
  key: 'homepage';
  productId: string;
  productSlug: string;
  productName: string;
  image: string;
  eyebrow: string;
  title: string;
  description: string;
  buttonText: string;
};

const siteBannerSchema = new Schema<HomepageBannerRecord>({
  key: { type: String, enum: ['homepage'], required: true, unique: true, default: 'homepage' },
  productId: { type: String, required: true, trim: true, maxlength: 180 },
  productSlug: { type: String, required: true, trim: true, maxlength: 140 },
  productName: { type: String, required: true, trim: true, maxlength: 140 },
  image: { type: String, required: true, trim: true, maxlength: 2048 },
  eyebrow: { type: String, required: true, trim: true, maxlength: 60 },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 280 },
  buttonText: { type: String, required: true, trim: true, maxlength: 40 }
}, { timestamps: true, versionKey: false });

export const SiteBanner = (mongoose.models.SiteBanner as mongoose.Model<HomepageBannerRecord> | undefined)
  || mongoose.model<HomepageBannerRecord>('SiteBanner', siteBannerSchema);

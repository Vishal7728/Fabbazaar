import mongoose, { Schema } from 'mongoose';

export type CustomerAddress = {
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
};

const addressSchema = new Schema<CustomerAddress>({
  label: { type: String, required: true, trim: true, maxlength: 40 },
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  phone: { type: String, trim: true, maxlength: 16, default: '' },
  line1: { type: String, required: true, trim: true, maxlength: 160 },
  line2: { type: String, trim: true, maxlength: 160 },
  city: { type: String, required: true, trim: true, maxlength: 80 },
  state: { type: String, required: true, trim: true, maxlength: 80 },
  pincode: { type: String, required: true, trim: true, maxlength: 12 },
  country: { type: String, required: true, trim: true, maxlength: 80 },
  isDefault: { type: Boolean, default: false }
}, { _id: true });

const customerSchema = new Schema({
  customerId: { type: String, unique: true, sparse: true, immutable: true },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  phone: { type: String, trim: true, maxlength: 16, default: '' },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer', immutable: true },
  status: { type: String, enum: ['active', 'deactivated'], default: 'active' },
  isEmailVerified: { type: Boolean, default: false },
  profileImage: { type: String, default: '' },
  wishlist: { type: [String], default: [] },
  addresses: { type: [addressSchema], default: [] },
  statusHistory: {
    type: [{
      actorId: { type: Schema.Types.ObjectId, required: true },
      from: { type: String, enum: ['active', 'deactivated'], required: true },
      to: { type: String, enum: ['active', 'deactivated'], required: true },
      changedAt: { type: Date, required: true }
    }],
    default: []
  },
  createdAt: { type: Date, default: Date.now, immutable: true },
  lastLoginAt: { type: Date, default: null },
  authVersion: { type: Number, default: 0, min: 0 },
  deletionRequestedAt: { type: Date, default: null },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: { createdAt: false, updatedAt: true } });
customerSchema.index({ role: 1, createdAt: -1 });
customerSchema.index({ role: 1, status: 1, createdAt: -1 });

const counterSchema = new Schema({ _id: String, value: { type: Number, required: true, default: 0 } });

export const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
const CustomerCounter = mongoose.models.CustomerCounter || mongoose.model('CustomerCounter', counterSchema);

export async function nextCustomerId(): Promise<string> {
  const existingCounter = await CustomerCounter.findById('customer');
  if (!existingCounter) {
    const latestCustomer = await Customer.aggregate<{ sequence: number }>([
      { $match: { customerId: /^FBZ-CUS-\d+$/ } },
      {
        $project: {
          sequence: {
            $convert: {
              input: { $substrCP: ['$customerId', 8, 100] },
              to: 'long',
              onError: 0,
              onNull: 0
            }
          }
        }
      },
      { $sort: { sequence: -1 } },
      { $limit: 1 }
    ]).exec();
    const latestSequence = latestCustomer[0]?.sequence ?? 0;
    try {
      await CustomerCounter.create({ _id: 'customer', value: latestSequence });
    } catch (error) {
      const isDuplicateCounterRace = typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
      if (!isDuplicateCounterRace) throw error;
    }
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const counter = await CustomerCounter.findByIdAndUpdate(
        'customer',
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );
      if (!counter) throw new Error('Unable to allocate a customer ID.');
      return `FBZ-CUS-${String(counter.get('value')).padStart(6, '0')}`;
    } catch (error) {
      const isDuplicateCounterRace = typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
      if (!isDuplicateCounterRace || attempt === 2) throw error;
    }
  }
  throw new Error('Unable to allocate a customer ID.');
}

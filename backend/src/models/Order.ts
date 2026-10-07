import mongoose, { Schema } from 'mongoose';

const orderItemSchema = new Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitAmount: { type: Number, required: true, min: 0 }
}, { _id: false });

const shippingAddressSchema = new Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  phone: { type: String, required: true, trim: true, maxlength: 16 },
  line1: { type: String, required: true, trim: true, maxlength: 160 },
  line2: { type: String, trim: true, maxlength: 160 },
  city: { type: String, required: true, trim: true, maxlength: 80 },
  state: { type: String, required: true, trim: true, maxlength: 80 },
  pincode: { type: String, required: true, trim: true, maxlength: 12 },
  country: { type: String, required: true, trim: true, maxlength: 80 }
}, { _id: false });

const orderSchema = new Schema({
  orderId: { type: String, required: true, unique: true, immutable: true },
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, immutable: true },
  customerId: { type: String, required: true, immutable: true },
  items: { type: [orderItemSchema], required: true },
  shippingAddress: { type: shippingAddressSchema, required: true },
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  promotionCode: { type: String, default: '', trim: true, uppercase: true, maxlength: 32 },
  shipping: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  currency: { type: String, enum: ['INR'], default: 'INR' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  fulfillmentStatus: { type: String, enum: ['pending', 'processing', 'dispatched', 'delivered', 'cancelled'], default: 'pending' },
  trackingNumber: { type: String, default: '' },
  trackingUrl: { type: String, default: '' },
  razorpayOrderId: { type: String, unique: true, sparse: true },
  razorpayPaymentId: { type: String, unique: true, sparse: true },
  paidAt: { type: Date, default: null }
}, { timestamps: true });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ fulfillmentStatus: 1, createdAt: -1 });

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

import mongoose, { Schema } from 'mongoose';

const ticketSchema = new Schema({
  ticketId: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  phone: { type: String, trim: true, maxlength: 24, default: '' },
  topic: { type: String, required: true, enum: ['product', 'shipping', 'cancellation', 'damaged', 'other'] },
  orderId: { type: String, trim: true, maxlength: 80, default: '' },
  message: { type: String, required: true, trim: true, maxlength: 3000 },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  emailSent: { type: Boolean, default: false }
}, { timestamps: true });

ticketSchema.index({ status: 1, createdAt: -1 });
export const SupportTicket = mongoose.models.SupportTicket || mongoose.model('SupportTicket', ticketSchema);

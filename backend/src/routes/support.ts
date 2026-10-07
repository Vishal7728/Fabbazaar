import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, requireAdmin, requireAuth } from '../middleware/auth';
import { SupportTicket } from '../models/SupportTicket';
import { sendSupportEmail } from '../lib/support-email';

const router = Router();
const ticketSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(24).optional().default(''),
  topic: z.enum(['product', 'shipping', 'cancellation', 'damaged', 'other']),
  orderId: z.string().trim().max(80).optional().default(''),
  message: z.string().trim().min(10).max(3000)
});

router.post('/tickets', asyncHandler(async (req, res) => {
  const payload = ticketSchema.parse(req.body);
  const ticket = await SupportTicket.create({ ...payload, ticketId: `FBZ-SUP-${randomUUID().slice(0, 8).toUpperCase()}` });
  let emailSent = false;
  try {
    emailSent = await sendSupportEmail({ ...payload, ticketId: ticket.get('ticketId') as string });
    if (emailSent) await SupportTicket.updateOne({ _id: ticket.id }, { $set: { emailSent: true } });
  } catch (error) {
    console.error('Support ticket notification failed', { ticketId: ticket.get('ticketId'), errorName: error instanceof Error ? error.name : 'UnknownError' });
  }
  return res.status(201).json({ data: { ticketId: ticket.get('ticketId'), email: process.env.SUPPORT_EMAIL || 'support@fabbazaar.com', emailSent } });
}));

router.get('/tickets', requireAuth, requireAdmin, asyncHandler(async (_req, res) => {
  const data = await SupportTicket.find().sort({ createdAt: -1 }).limit(200).lean();
  return res.json({ data });
}));

router.patch('/tickets/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const status = z.object({ status: z.enum(['open', 'resolved']) }).parse(req.body).status;
  const updated = await SupportTicket.findOneAndUpdate({ ticketId: req.params.id }, { status }, { new: true, runValidators: true });
  if (!updated) return res.status(404).json({ error: 'Support ticket not found.' });
  return res.json({ data: updated });
}));

export default router;

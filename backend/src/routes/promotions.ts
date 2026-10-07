import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, requireAdmin, requireAuth } from '../middleware/auth';
import { Promotion } from '../models/Promotion';

const router = Router();
const promotionSchema = z.object({
  code: z.string().trim().min(3).max(32).regex(/^[A-Za-z0-9_-]+$/).transform((value) => value.toUpperCase()),
  type: z.enum(['percent', 'fixed']),
  value: z.number().finite().min(1),
  minimumOrder: z.number().finite().min(0).default(0),
  maximumDiscount: z.number().finite().min(1).nullable().default(null),
  expiresAt: z.string().datetime().nullable().default(null),
  active: z.boolean().default(true)
}).superRefine((value, context) => {
  if (value.type === 'percent' && value.value > 90) context.addIssue({ code: 'custom', path: ['value'], message: 'Percent discounts must be 90% or less.' });
});

router.post('/validate', asyncHandler(async (req, res) => {
  const input = z.object({ code: z.string().trim().min(1).max(32), subtotal: z.number().finite().min(0) }).parse(req.body);
  const promotion = await Promotion.findOne({ code: input.code.toUpperCase(), active: true }).lean();
  if (!promotion || (promotion.expiresAt && promotion.expiresAt <= new Date())) return res.status(404).json({ error: 'That promotion code is invalid or expired.' });
  if (input.subtotal < promotion.minimumOrder) return res.status(400).json({ error: `This code requires a minimum order of ₹${promotion.minimumOrder.toLocaleString('en-IN')}.` });
  const rawDiscount = promotion.type === 'percent' ? input.subtotal * promotion.value / 100 : promotion.value;
  const discount = Math.min(input.subtotal, promotion.maximumDiscount == null ? rawDiscount : Math.min(rawDiscount, promotion.maximumDiscount));
  return res.json({ data: { code: promotion.code, discount: Math.round(discount * 100) / 100, type: promotion.type, value: promotion.value } });
}));

router.get('/admin', requireAuth, requireAdmin, asyncHandler(async (_req, res) => res.json({ data: await Promotion.find().sort({ createdAt: -1 }).lean() })));
router.post('/admin', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const payload = promotionSchema.parse(req.body);
  if (await Promotion.exists({ code: payload.code })) return res.status(409).json({ error: 'That promotion code already exists.' });
  const promotion = await Promotion.create(payload);
  return res.status(201).json({ data: promotion });
}));
router.put('/admin/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const payload = promotionSchema.parse(req.body);
  if (await Promotion.exists({ code: payload.code, _id: { $ne: req.params.id } })) return res.status(409).json({ error: 'That promotion code already exists.' });
  const promotion = await Promotion.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  if (!promotion) return res.status(404).json({ error: 'Promotion not found.' });
  return res.json({ data: promotion });
}));
router.delete('/admin/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const promotion = await Promotion.findByIdAndDelete(req.params.id);
  if (!promotion) return res.status(404).json({ error: 'Promotion not found.' });
  return res.json({ ok: true });
}));

export default router;

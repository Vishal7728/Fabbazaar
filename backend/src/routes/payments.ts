import { createHmac, timingSafeEqual } from 'node:crypto';
import mongoose from 'mongoose';
import { Router } from 'express';
import { z } from 'zod';
import { getProducts } from '../lib/store';
import { AuthAccount, asyncHandler, requireAuth } from '../middleware/auth';
import { Order } from '../models/Order';
import { Promotion } from '../models/Promotion';

const router = Router();
const paymentSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1).max(160),
    quantity: z.number().int().min(1).max(99)
  })).min(1).max(30).refine(
    (items) => new Set(items.map((item) => item.productId)).size === items.length,
    'Each product can appear only once in an order'
  ),
  promotionCode: z.string().trim().max(32).optional().default(''),
  shippingAddress: z.object({
    fullName: z.string().trim().min(2).max(100),
    phone: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/),
    line1: z.string().trim().min(4).max(160),
    line2: z.string().trim().max(160).optional(),
    city: z.string().trim().min(2).max(80),
    state: z.string().trim().min(2).max(80),
    pincode: z.string().trim().min(4).max(12),
    country: z.string().trim().min(2).max(80)
  })
});
const verifySchema = z.object({
  orderId: z.string().min(1).max(80),
  razorpay_order_id: z.string().min(1).max(100),
  razorpay_payment_id: z.string().min(1).max(100),
  razorpay_signature: z.string().regex(/^[a-f\d]{64}$/i)
});

function getTestCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId?.startsWith('rzp_test_') || !keySecret) return null;
  return { keyId, keySecret };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function gatewayRequest(path: string, method: 'GET' | 'POST', body?: Record<string, unknown>) {
  const credentials = getTestCredentials();
  if (!credentials) throw new Error('Razorpay test credentials are not configured.');

  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${credentials.keyId}:${credentials.keySecret}`).toString('base64')}`,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(10000)
  });
  const result: unknown = await response.json();
  if (!response.ok) {
    console.error('Razorpay test API request failed', { status: response.status });
    throw new Error('Payment provider rejected the request.');
  }
  if (!isRecord(result)) throw new Error('Payment provider returned an invalid response.');
  return result;
}

router.get('/config', (_req, res) => {
  const credentials = getTestCredentials();
  const databaseReady = mongoose.connection.readyState === 1;
  return res.json({
    enabled: Boolean(credentials && databaseReady),
    keyId: credentials?.keyId ?? null,
    mode: 'test',
    reason: !credentials ? 'test-credentials-missing' : !databaseReady ? 'database-unavailable' : null
  });
});

router.post('/create-order', requireAuth, asyncHandler(async (req, res) => {
  const account = res.locals.account as AuthAccount;
  if (account.role !== 'customer') return res.status(403).json({ error: 'Customer account required' });
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Order database is unavailable' });
  const credentials = getTestCredentials();
  if (!credentials) return res.status(503).json({ error: 'Razorpay test credentials are not configured' });
  const payload = paymentSchema.parse(req.body);

  const products = getProducts();
  const items = payload.items.map((line) => {
    const product = products.find((entry) => entry.id === line.productId || entry.slug === line.productId);
    if (!product) return null;
    return {
      productId: product.id,
      name: product.name,
      image: product.image,
      quantity: line.quantity,
      unitAmount: product.price * 100
    };
  });
  if (items.some((item) => item === null)) return res.status(400).json({ error: 'Cart contains an unknown product' });
  const validItems = items.filter((item): item is NonNullable<typeof item> => item !== null);
  if (new Set(validItems.map((item) => item.productId)).size !== validItems.length) {
    return res.status(400).json({ error: 'Cart contains the same product more than once' });
  }
  const subtotal = validItems.reduce((amount, item) => amount + item.unitAmount * item.quantity, 0);
  const shipping = subtotal > 300000 ? 0 : 19900;
  let discount = 0;
  let promotionCode = '';
  if (payload.promotionCode) {
    const promotion = await Promotion.findOne({ code: payload.promotionCode.toUpperCase(), active: true }).lean();
    const subtotalRupees = subtotal / 100;
    if (!promotion || (promotion.expiresAt && promotion.expiresAt <= new Date())) return res.status(400).json({ error: 'That promotion code is invalid or expired.' });
    if (subtotalRupees < promotion.minimumOrder) return res.status(400).json({ error: `This code requires a minimum order of ₹${promotion.minimumOrder.toLocaleString('en-IN')}.` });
    const raw = promotion.type === 'percent' ? subtotal * promotion.value / 100 : promotion.value * 100;
    discount = Math.min(subtotal, Math.round(promotion.maximumDiscount == null ? raw : Math.min(raw, promotion.maximumDiscount * 100)));
    promotionCode = promotion.code;
  }
  const total = subtotal + shipping - discount;
  const orderId = `FBZ-ORD-${new mongoose.Types.ObjectId().toHexString().toUpperCase()}`;

  try {
    const gatewayOrder = await gatewayRequest('orders', 'POST', {
      amount: total,
      currency: 'INR',
      receipt: orderId,
      notes: { fabbazaar_order_id: orderId }
    });
    if (typeof gatewayOrder.id !== 'string' || gatewayOrder.amount !== total || gatewayOrder.currency !== 'INR') {
      throw new Error('Payment provider returned an invalid order.');
    }

    await Order.create({
      orderId,
      customer: account.id,
      customerId: account.customerId ?? account.id,
      items: validItems,
      shippingAddress: payload.shippingAddress,
      subtotal,
      discount,
      promotionCode,
      shipping,
      total,
      razorpayOrderId: gatewayOrder.id
    });

    return res.status(201).json({
      data: { orderId, razorpayOrderId: gatewayOrder.id, amount: total, discount, promotionCode, currency: 'INR', keyId: credentials.keyId }
    });
  } catch (error) {
    console.error('Unable to create Razorpay test order', error);
    return res.status(502).json({ error: 'Unable to create a test payment. No charge was made.' });
  }
}));

router.post('/verify', requireAuth, asyncHandler(async (req, res) => {
  const account = res.locals.account as AuthAccount;
  if (account.role !== 'customer') return res.status(403).json({ error: 'Customer account required' });
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Order database is unavailable' });
  const payload = verifySchema.parse(req.body);
  const credentials = getTestCredentials();
  if (!credentials) return res.status(503).json({ error: 'Razorpay test credentials are not configured' });

  const order = await Order.findOne({ orderId: payload.orderId, customer: account.id });
  if (!order || order.get('razorpayOrderId') !== payload.razorpay_order_id) {
    return res.status(404).json({ error: 'Payment order not found' });
  }
  const expectedSignature = createHmac('sha256', credentials.keySecret)
    .update(`${payload.razorpay_order_id}|${payload.razorpay_payment_id}`)
    .digest();
  const receivedSignature = Buffer.from(payload.razorpay_signature, 'hex');
  if (receivedSignature.length !== expectedSignature.length || !timingSafeEqual(receivedSignature, expectedSignature)) {
    return res.status(400).json({ error: 'Payment signature verification failed' });
  }
  if (order.get('paymentStatus') === 'paid') {
    if (order.get('razorpayPaymentId') !== payload.razorpay_payment_id) {
      return res.status(409).json({ error: 'This order is already linked to a different payment' });
    }
    return res.json({ data: { orderId: payload.orderId, paymentStatus: 'paid' } });
  }

  const payment = await gatewayRequest(`payments/${encodeURIComponent(payload.razorpay_payment_id)}`, 'GET');
  if (
    payment.status !== 'captured' ||
    payment.order_id !== payload.razorpay_order_id ||
    payment.amount !== order.get('total') ||
    payment.currency !== 'INR'
  ) {
    return res.status(400).json({ error: 'Payment has not been captured for this order' });
  }

  const paidOrder = await Order.findOneAndUpdate(
    { _id: order.id, paymentStatus: 'pending' },
    { $set: { paymentStatus: 'paid', razorpayPaymentId: payload.razorpay_payment_id, paidAt: new Date() } },
    { new: true, runValidators: true }
  );
  if (!paidOrder) {
    const latestOrder = await Order.findById(order.id).select('paymentStatus razorpayPaymentId');
    if (latestOrder?.get('paymentStatus') === 'paid' && latestOrder.get('razorpayPaymentId') === payload.razorpay_payment_id) {
      return res.json({ data: { orderId: payload.orderId, paymentStatus: 'paid' } });
    }
    return res.status(409).json({ error: 'Payment status changed. Refresh the order and try again.' });
  }
  return res.json({ data: { orderId: payload.orderId, paymentStatus: 'paid' } });
}));

export default router;

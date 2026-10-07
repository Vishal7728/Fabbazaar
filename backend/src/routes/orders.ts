import { Router } from 'express';
import { z } from 'zod';
import { AuthAccount, asyncHandler, requireAdmin, requireAuth } from '../middleware/auth';
import { canChangeFulfillment, FulfillmentStatus, PaymentStatus } from '../lib/order-state';
import { Order } from '../models/Order';

const router = Router();
const orderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(['pending', 'processing', 'dispatched', 'delivered', 'cancelled']).optional(),
  search: z.string().trim().max(100).optional()
});
const fulfillmentSchema = z.object({
  status: z.enum(['pending', 'processing', 'dispatched', 'delivered', 'cancelled']),
  trackingNumber: z.string().trim().max(100).optional(),
  trackingUrl: z.string().trim().max(500).refine((value) => {
    if (value === '') return true;
    try {
      return new URL(value).protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Tracking URL must use HTTPS').optional()
});
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const account = res.locals.account as AuthAccount;
  const query = orderListQuerySchema.parse(req.query);
  const filter: Record<string, unknown> = {};
  if (account.role !== 'admin') filter.customer = account.id;
  if (query.status) filter.fulfillmentStatus = query.status;
  if (query.search) {
    const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const search = new RegExp(escaped, 'i');
    filter.$or = [{ orderId: search }, { customerId: search }];
  }

  try {
    const [orders, total] = await Promise.all([
      Order.find(filter).populate('customer', 'name').sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit),
      Order.countDocuments(filter)
    ]);
    return res.json({
      data: orders.map((order) => {
        const customer = order.get('customer');
        return {
          orderId: order.get('orderId'),
          customerId: order.get('customerId'),
          customerName: customer && typeof customer === 'object' && 'name' in customer ? customer.name : '',
          items: order.get('items'),
          subtotal: order.get('subtotal'),
          shipping: order.get('shipping'),
          total: order.get('total'),
          currency: order.get('currency'),
          paymentStatus: order.get('paymentStatus'),
          fulfillmentStatus: order.get('fulfillmentStatus'),
          trackingNumber: order.get('trackingNumber'),
          trackingUrl: order.get('trackingUrl'),
          createdAt: order.get('createdAt')
        };
      }),
      pagination: { page: query.page, limit: query.limit, total, totalPages: Math.max(1, Math.ceil(total / query.limit)) }
    });
  } catch (error) {
    console.error('Order list query failed', error);
    return res.status(500).json({ error: 'Unable to load orders' });
  }
}));

router.get('/:orderId', asyncHandler(async (req, res) => {
  const account = res.locals.account as AuthAccount;
  const filter: Record<string, unknown> = { orderId: req.params.orderId };
  if (account.role !== 'admin') filter.customer = account.id;
  try {
    const order = await Order.findOne(filter);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    return res.json({
      data: {
        orderId: order.get('orderId'),
        customerId: order.get('customerId'),
        items: order.get('items'),
        shippingAddress: order.get('shippingAddress'),
        subtotal: order.get('subtotal'),
        shipping: order.get('shipping'),
        total: order.get('total'),
        currency: order.get('currency'),
        paymentStatus: order.get('paymentStatus'),
        fulfillmentStatus: order.get('fulfillmentStatus'),
        trackingNumber: order.get('trackingNumber'),
        trackingUrl: order.get('trackingUrl'),
        createdAt: order.get('createdAt'),
        paidAt: order.get('paidAt')
      }
    });
  } catch (error) {
    console.error('Order detail query failed', error);
    return res.status(500).json({ error: 'Unable to load order details' });
  }
}));

router.patch('/:orderId/fulfillment', requireAdmin, asyncHandler(async (req, res) => {
  const payload = fulfillmentSchema.parse(req.body);
  try {
    const current = await Order.findOne({ orderId: req.params.orderId }).select('fulfillmentStatus paymentStatus');
    if (!current) return res.status(404).json({ error: 'Order not found' });
    const currentStatus = current.get('fulfillmentStatus') as FulfillmentStatus;
    const paymentStatus = current.get('paymentStatus') as PaymentStatus;
    if (!canChangeFulfillment(currentStatus, payload.status, paymentStatus)) {
      return res.status(409).json({ error: `Cannot change fulfillment from ${currentStatus} to ${payload.status} for a ${paymentStatus} payment` });
    }
    const updated = await Order.findOneAndUpdate(
      { orderId: req.params.orderId, fulfillmentStatus: currentStatus },
      {
        $set: {
          fulfillmentStatus: payload.status,
          trackingNumber: payload.trackingNumber ?? '',
          trackingUrl: payload.trackingUrl ?? ''
        }
      },
      { new: true, runValidators: true }
    ).select('orderId fulfillmentStatus trackingNumber trackingUrl');
    if (!updated) return res.status(409).json({ error: 'Order status changed. Refresh and try again.' });
    return res.json({
      data: {
        orderId: updated.get('orderId'),
        fulfillmentStatus: updated.get('fulfillmentStatus'),
        trackingNumber: updated.get('trackingNumber'),
        trackingUrl: updated.get('trackingUrl')
      }
    });
  } catch (error) {
    console.error('Order fulfilment update failed', error);
    return res.status(500).json({ error: 'Unable to update order fulfilment' });
  }
}));

export default router;

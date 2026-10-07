import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, requireAdmin, requireAuth } from '../middleware/auth';
import { Customer } from '../models/Customer';
import { Order } from '../models/Order';
import { getProducts, replaceProducts } from '../lib/store';
import { Product } from '../models/Product';

const router = Router();
router.use(requireAuth, requireAdmin);

const productSchema = z.object({
  slug: z.string().trim().min(2).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(2).max(140),
  category: z.string().trim().min(2).max(80),
  collection: z.enum(['Rivaaz', 'Jaipuri Collection', 'Bazaar Exclusive']).default('Bazaar Exclusive'),
  price: z.number().finite().min(0),
  originalPrice: z.number().finite().min(0).optional(),
  rating: z.number().finite().min(0).max(5).default(0),
  reviews: z.number().int().min(0).default(0),
  colors: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  sizes: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  stock: z.number().int().min(0).default(0),
  description: z.string().trim().min(5).max(4000),
  shortDescription: z.string().trim().min(2).max(240),
  image: z.string().trim().min(1).max(2048),
  gallery: z.array(z.string().trim().min(1).max(2048)).max(6).default([]),
  featured: z.boolean().default(false),
  newArrival: z.boolean().default(false),
  tags: z.array(z.string().trim().min(1).max(40)).max(30).default([])
});

router.get('/products', (_req, res) => res.json({ data: getProducts() }));

router.get('/products/:id', (req, res) => {
  const product = getProducts().find((entry) => entry.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product listing not found.' });
  return res.json({ data: product });
});

router.post('/products', asyncHandler(async (req, res) => {
  const payload = productSchema.parse(req.body);
  if (await Product.exists({ $or: [{ slug: payload.slug }, { id: `product-${payload.slug}` }] })) {
    return res.status(409).json({ error: 'A product with this listing name already exists.' });
  }
  const product = await Product.create({ ...payload, id: `product-${payload.slug}` });
  replaceProducts([...getProducts(), product.toObject()]);
  return res.status(201).json({ data: product });
}));

router.put('/products/:id', asyncHandler(async (req, res) => {
  const payload = productSchema.parse(req.body);
  if (await Product.exists({ slug: payload.slug, id: { $ne: req.params.id } })) {
    return res.status(409).json({ error: 'A product with this listing name already exists.' });
  }
  const product = await Product.findOneAndUpdate({ id: req.params.id }, payload, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ error: 'Product listing not found.' });
  replaceProducts(getProducts().map((entry) => entry.id === req.params.id ? product.toObject() : entry));
  return res.json({ data: product });
}));

router.delete('/products/:id', asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({ id: req.params.id });
  if (!product) return res.status(404).json({ error: 'Product listing not found.' });
  replaceProducts(getProducts().filter((entry) => entry.id !== req.params.id));
  return res.json({ ok: true });
}));

router.get('/overview', asyncHandler(async (_req, res) => {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const chartStart = new Date(today);
  chartStart.setUTCDate(chartStart.getUTCDate() - 29);

  try {
    const [orderData, customerData] = await Promise.all([
      Order.aggregate([
        {
          $facet: {
            sales: [
              { $match: { paymentStatus: 'paid' } },
              { $group: { _id: null, revenue: { $sum: '$total' }, paidOrderCount: { $sum: 1 }, averageOrderValue: { $avg: '$total' } } }
            ],
            today: [
              { $match: { paymentStatus: 'paid', createdAt: { $gte: today } } },
              { $group: { _id: null, revenue: { $sum: '$total' } } }
            ],
            month: [
              { $match: { paymentStatus: 'paid', createdAt: { $gte: monthStart } } },
              { $group: { _id: null, revenue: { $sum: '$total' } } }
            ],
            statuses: [{ $group: { _id: '$fulfillmentStatus', count: { $sum: 1 } } }],
            totals: [{ $count: 'count' }],
            refunds: [{ $match: { paymentStatus: 'refunded' } }, { $count: 'count' }],
            revenueTrend: [
              { $match: { paymentStatus: 'paid', createdAt: { $gte: chartStart } } },
              { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, amount: { $sum: '$total' } } },
              { $sort: { _id: 1 } }
            ],
            orderTrend: [
              { $match: { createdAt: { $gte: chartStart } } },
              { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
              { $sort: { _id: 1 } }
            ],
            bestSellers: [
              { $match: { paymentStatus: 'paid' } },
              { $unwind: '$items' },
              { $group: { _id: '$items.name', units: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.unitAmount', '$items.quantity'] } } } },
              { $sort: { units: -1 } },
              { $limit: 5 }
            ]
          }
        }
      ]),
      Customer.aggregate([
        { $match: { role: 'customer' } },
        {
          $facet: {
            total: [{ $count: 'count' }],
            newThisMonth: [{ $match: { createdAt: { $gte: monthStart } } }, { $count: 'count' }],
            growth: [
              { $match: { createdAt: { $gte: chartStart } } },
              { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
              { $sort: { _id: 1 } }
            ]
          }
        }
      ])
    ]);

    const orders = orderData[0] ?? {};
    const sales = orders.sales?.[0] ?? {};
    const statusCounts = Object.fromEntries((orders.statuses ?? []).map((entry: { _id: string; count: number }) => [entry._id, entry.count]));
    const customers = customerData[0] ?? {};
    return res.json({
      metrics: {
        totalRevenue: sales.revenue ?? 0,
        todaysSales: orders.today?.[0]?.revenue ?? 0,
        monthlySales: orders.month?.[0]?.revenue ?? 0,
        totalOrders: orders.totals?.[0]?.count ?? 0,
        pendingOrders: statusCounts.pending ?? 0,
        processingOrders: statusCounts.processing ?? 0,
        dispatchedOrders: statusCounts.dispatched ?? 0,
        deliveredOrders: statusCounts.delivered ?? 0,
        cancelledOrders: statusCounts.cancelled ?? 0,
        refunds: orders.refunds?.[0]?.count ?? 0,
        totalRegisteredCustomers: customers.total?.[0]?.count ?? 0,
        newCustomers: customers.newThisMonth?.[0]?.count ?? 0,
        totalProducts: getProducts().length,
        lowStockProducts: null,
        averageOrderValue: sales.averageOrderValue ?? 0
      },
      charts: {
        revenue: orders.revenueTrend ?? [],
        orders: orders.orderTrend ?? [],
        bestSellers: (orders.bestSellers ?? []).map((entry: { _id: string; units: number; revenue: number }) => ({
          name: entry._id,
          units: entry.units,
          revenue: entry.revenue
        })),
        customerGrowth: customers.growth ?? []
      }
    });
  } catch (error) {
    console.error('Admin overview query failed', error);
    return res.status(500).json({ error: 'Unable to load the administration overview' });
  }
}));

export default router;

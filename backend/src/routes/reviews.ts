import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { getProductBySlug } from '../lib/store';
import { AuthAccount, asyncHandler, requireAuth } from '../middleware/auth';
import { Order } from '../models/Order';
import { Review } from '../models/Review';

const router = Router();
const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(5).max(2000)
});

router.get('/me', requireAuth, asyncHandler(async (_req, res) => {
  const account = res.locals.account as AuthAccount;
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Review database is unavailable' });
  try {
    const reviews = await Review.find({ customer: account.id }).sort({ createdAt: -1 }).select('productId productSlug productName rating comment createdAt');
    return res.json({ data: reviews });
  } catch (error) {
    console.error('Customer review query failed', error);
    return res.status(500).json({ error: 'Unable to load your reviews' });
  }
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const slug = req.params.slug;
  if (typeof slug !== 'string') return res.status(400).json({ error: 'Invalid product slug' });
  const product = getProductBySlug(slug);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (mongoose.connection.readyState !== 1) {
    return res.json({ data: { averageRating: 0, totalReviews: 0, reviews: [] } });
  }
  try {
    const [summary] = await Review.aggregate([
      { $match: { productId: product.id } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
    ]);
    const reviews = await Review.find({ productId: product.id })
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .limit(50)
      .select('rating comment createdAt customer');
    return res.json({
      data: {
        averageRating: Number((summary?.averageRating ?? 0).toFixed(1)),
        totalReviews: summary?.totalReviews ?? 0,
        reviews: reviews.map((review) => {
          const customer = review.get('customer');
          return {
            rating: review.get('rating'),
            comment: review.get('comment'),
            createdAt: review.get('createdAt'),
            customerName: customer && typeof customer === 'object' && 'name' in customer ? customer.name : 'Customer'
          };
        })
      }
    });
  } catch (error) {
    console.error('Product review query failed', error);
    return res.status(500).json({ error: 'Unable to load product reviews' });
  }
}));

router.post('/:slug', requireAuth, asyncHandler(async (req, res) => {
  const account = res.locals.account as AuthAccount;
  if (account.role !== 'customer') return res.status(403).json({ error: 'Customer account required' });
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Review database is unavailable' });
  const payload = reviewSchema.parse(req.body);
  const slug = req.params.slug;
  if (typeof slug !== 'string') return res.status(400).json({ error: 'Invalid product slug' });
  const product = getProductBySlug(slug);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  try {
    const purchased = await Order.exists({
      customer: account.id,
      paymentStatus: 'paid',
      fulfillmentStatus: 'delivered',
      'items.productId': product.id
    });
    if (!purchased) return res.status(403).json({ error: 'Only delivered, paid purchases are eligible for review' });
    const review = await Review.create({
      customer: account.id,
      customerId: account.customerId ?? account.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      rating: payload.rating,
      comment: payload.comment
    });
    return res.status(201).json({
      data: {
        id: review.id,
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        rating: review.get('rating'),
        comment: review.get('comment'),
        createdAt: review.get('createdAt')
      }
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      return res.status(409).json({ error: 'You have already reviewed this product' });
    }
    console.error('Product review creation failed', error);
    return res.status(500).json({ error: 'Unable to save your review' });
  }
}));

export default router;

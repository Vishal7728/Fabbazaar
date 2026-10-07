import { Router } from 'express';
import { z } from 'zod';
import { getCategories, getFeaturedProducts, getProductBySlug, getProducts } from '../lib/store';

const router = Router();

const querySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['featured', 'price-low', 'price-high', 'rating']).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(40).optional()
});

router.get('/', (req, res) => {
  const query = querySchema.parse(req.query);
  let products = getProducts();

  if (query.category) {
    products = products.filter((product) => product.category.toLowerCase() === query.category?.toLowerCase());
  }

  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    products = products.filter((product) => {
      const haystack = [product.name, product.category, product.shortDescription, product.tags.join(' ')].join(' ').toLowerCase();
      return haystack.includes(searchTerm);
    });
  }

  if (query.sort === 'price-low') {
    products = [...products].sort((a, b) => a.price - b.price);
  }

  if (query.sort === 'price-high') {
    products = [...products].sort((a, b) => b.price - a.price);
  }

  if (query.sort === 'rating') {
    products = [...products].sort((a, b) => b.rating - a.rating);
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 8;
  const totalPages = Math.max(1, Math.ceil(products.length / limit));
  const sliced = products.slice((page - 1) * limit, page * limit);

  res.json({
    data: sliced,
    pagination: {
      page,
      limit,
      total: products.length,
      totalPages
    }
  });
});

router.get('/featured', (_, res) => {
  res.json({ data: getFeaturedProducts() });
});

router.get('/categories', (_, res) => {
  res.json({ data: getCategories() });
});

router.get('/:slug', (req, res) => {
  const product = getProductBySlug(req.params.slug);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  return res.json({ data: product });
});

export default router;

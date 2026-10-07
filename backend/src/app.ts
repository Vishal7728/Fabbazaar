import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/products';
import authRoutes from './routes/auth';
import reviewRoutes from './routes/reviews';
import customerRoutes from './routes/customers';
import paymentRoutes from './routes/payments';
import orderRoutes from './routes/orders';
import adminRoutes from './routes/admin';
import uploadRoutes from './routes/uploads';
import supportRoutes from './routes/support';
import promotionRoutes from './routes/promotions';
import { uploadsDirectory } from './lib/uploads';
import { ZodError } from 'zod';
import { allowedOrigins, authenticationRateLimit, isLocalDevelopmentOrigin, securityHeaders, supportRequestRateLimit } from './middleware/security';
import { initializeApplication } from './bootstrap';

dotenv.config();

const app = express();

app.use(securityHeaders);
const corsOrigins = allowedOrigins();
app.use(cors({
  origin: (origin, callback) => callback(null, !origin || corsOrigins.has(origin) || (
    process.env.NODE_ENV !== 'production' && isLocalDevelopmentOrigin(origin)
  ))
}));
app.use(express.json({ limit: '2mb' }));

if (process.env.VERCEL === '1' && process.env.NODE_ENV !== 'test') {
  app.use(async (_req, res, next) => {
    try {
      await initializeApplication();
      next();
    } catch (error) {
      console.error('Serverless API initialization failed', error);
      res.status(503).json({ error: 'API initialization failed; please try again shortly' });
    }
  });
}

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', app: 'FabBazaar API', timestamp: new Date().toISOString() });
});

app.use('/uploads', express.static(uploadsDirectory, { dotfiles: 'deny', index: false, maxAge: '7d' }));

app.use('/api/products', productRoutes);
app.use('/api/auth/login', authenticationRateLimit);
app.use('/api/auth/register', authenticationRateLimit);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
if (process.env.VERCEL === '1') {
  app.use('/api/admin/uploads', (_req, res) => {
    res.status(503).json({ error: 'Image uploads require persistent storage and are disabled on this deployment' });
  });
} else {
  app.use('/api/admin/uploads', uploadRoutes);
}
app.use('/api/support/tickets', supportRequestRateLimit);
app.use('/api/support', supportRoutes);
app.use('/api/promotions', promotionRoutes);

app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: 'Invalid request', details: error.issues });
  }
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = error.status;
    if (status === 400) return res.status(400).json({ error: 'Malformed request body' });
    if (status === 413) return res.status(413).json({ error: 'Request body is too large' });
  }
  console.error('Unhandled API error', error);
  return res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;

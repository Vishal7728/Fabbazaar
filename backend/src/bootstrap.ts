import { connectDB } from './config/db';
import { Product } from './models/Product';
import { products } from './data/catalog-products';
import type { ProductRecord } from './data/seed';
import { replaceProducts } from './lib/store';
import { provisionAdminAccount } from './routes/auth';
import { jwtSecret } from './middleware/auth';

let initialization: Promise<void> | undefined;

async function initialize(): Promise<void> {
  jwtSecret();
  const connected = await connectDB();
  if (!connected) throw new Error('MongoDB is unavailable. Check MONGODB_URI and database access.');

  await Product.init();
  await Product.updateMany({ collection: { $exists: false } }, { $set: { collection: 'Bazaar Exclusive' } });
  if (await Product.countDocuments() === 0) await Product.insertMany(products);
  const catalog = await Product.find().lean();
  replaceProducts(catalog.map((product) => {
    const { _id, createdAt, updatedAt, ...fields } = product;
    void _id;
    void createdAt;
    void updatedAt;
    return fields as unknown as ProductRecord;
  }));
  await provisionAdminAccount();
}

export function initializeApplication(): Promise<void> {
  if (!initialization) {
    initialization = initialize().catch((error: unknown) => {
      initialization = undefined;
      throw error;
    });
  }
  return initialization;
}

import app from './app';
import { connectDB } from './config/db';
import { provisionAdminAccount } from './routes/auth';
import { jwtSecret } from './middleware/auth';
import { Product } from './models/Product';
import { products } from './data/catalog-products';
import type { ProductRecord } from './data/seed';
import { replaceProducts } from './lib/store';

const port = Number(process.env.PORT || 4000);

async function startServer() {
  jwtSecret();
  const connected = await connectDB();
  if (!connected) throw new Error('MongoDB is unavailable. Check MONGODB_URI and ensure the database is running.');
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
  app.listen(port, '0.0.0.0', () => {
    console.log(`FabBazaar API running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});

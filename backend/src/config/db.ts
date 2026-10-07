import mongoose from 'mongoose';

export async function connectDB(): Promise<boolean> {
  const configuredUri = process.env.MONGODB_URI;
  if (process.env.NODE_ENV === 'production' && !configuredUri) {
    console.error('MongoDB connection failed: MONGODB_URI is required in production.');
    return false;
  }
  const uri = configuredUri || 'mongodb://127.0.0.1:27017/fabbazaar';

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('MongoDB connection failed. Customer registration and accounts require a working MongoDB connection.', {
      errorName: error instanceof Error ? error.name : 'UnknownError'
    });
    return false;
  }
}

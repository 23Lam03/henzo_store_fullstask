import mongoose from 'mongoose';
import { config } from '../config/env';

let cached = globalThis as unknown as {
  mongooseConn?: typeof mongoose | null;
  mongoosePromise?: Promise<typeof mongoose> | null;
};

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.mongooseConn) return cached.mongooseConn;

  if (!cached.mongoosePromise) {
    mongoose.set('strictQuery', true);
    cached.mongoosePromise = mongoose
      .connect(config.MONGODB_URI, {
        serverSelectionTimeoutMS: 10_000,
        maxPoolSize: 10,
      })
      .then((m) => {
        cached.mongooseConn = m;
        return m;
      })
      .catch((err) => {
        cached.mongoosePromise = null;
        throw err;
      });
  }

  return cached.mongoosePromise;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  cached.mongooseConn = null;
  cached.mongoosePromise = null;
}

export { mongoose };

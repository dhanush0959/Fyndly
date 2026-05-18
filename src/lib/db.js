import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Defer the error to runtime so Next.js build-time analysis can complete
// (env vars are not available during `next build` static page collection)
if (!MONGODB_URI) {
  console.warn(
    '[Fyndly] MONGODB_URI is not defined. Set it in .env.local before starting the server.'
  );
}

/**
 * Global cache to prevent multiple connections in Next.js dev mode (hot reload).
 * In production, each serverless function instance maintains one connection.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

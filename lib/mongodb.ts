import mongoose, { Mongoose } from "mongoose";

// Shape of the cached connection we stash on the Node.js global object.
interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

// Augment the NodeJS global type so TypeScript knows about our custom cache
// property instead of forcing us to use `any`.
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

// In development, Next.js hot-reloads modules on every request, which would
// otherwise create a new database connection each time. Caching the
// connection (and the in-flight connection promise) on `global` survives
// module reloads and keeps us to a single connection.
const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Connects to MongoDB using Mongoose, reusing an existing connection
 * (or in-flight connection attempt) whenever one is available.
 */
export async function connectToDatabase(): Promise<Mongoose> {
  // Already connected: return the cached connection immediately.
  if (cached.conn) {
    return cached.conn;
  }

  // No connection attempt in progress: start one and cache the promise so
  // concurrent callers await the same connection instead of racing to
  // create multiple ones.
  if (!cached.promise) {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      throw new Error(
        "Please define the MONGODB_URI environment variable inside .env.local"
      );
    }

    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset the cached promise on failure so the next call can retry
    // instead of being stuck with a rejected promise forever.
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectToDatabase;

import "server-only";

import mongoose from "mongoose";

// Next.js hot-reloads modules in dev, which would otherwise open a new
// connection pool on every edit until Atlas refuses them.
const globalForMongoose = globalThis as unknown as {
  mongooseConn?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

const cached = globalForMongoose.mongooseConn ?? {
  conn: null,
  promise: null,
};

globalForMongoose.mongooseConn = cached;

/** Every query path awaits this first. Concurrent callers share one
 *  in-flight connection promise rather than racing to open several. */
export async function connectDb() {
  if (cached.conn) return cached.conn;

  // checked here rather than at module scope: importing this file must not
  // throw during `next build` before anything actually queries
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env.");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      maxPoolSize: 10,
      // Mongoose waits 30s by default before giving up on finding a server.
      // Behind Passenger that is not a slow page, it is an outage: each stuck
      // request holds a worker, the small pool fills, and pages that never
      // touch the database stop being served too. Eight seconds is far more
      // than a healthy Atlas connection needs (typically under a second) and
      // turns "the whole site is frozen" into "these pages error, the
      // prerendered ones still work".
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      socketTimeoutMS: 20000,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // let the next request retry instead of caching a rejected promise
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export { mongoose };

// Single shared MongoDB connection for the whole server. Never import this
// from client code (it lives under $lib/server, which SvelteKit refuses to
// bundle into the browser). See CLAUDE.md §4.
import mongoose from 'mongoose';
import { env } from '$env/dynamic/private';

// Cache the connection promise so HMR reloads and concurrent requests reuse a
// single pool instead of opening a new connection each time.
let connection: Promise<typeof mongoose> | null = null;

export function connectDb(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose);
  if (!connection) {
    const uri = env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set');
    // Read at runtime (dynamic env), so `npm run build` works without a DB.
    connection = mongoose.connect(uri);
  }
  return connection;
}

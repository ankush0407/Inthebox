import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { withRetry } from "./dbRetry";

neonConfig.webSocketConstructor = ws;
neonConfig.fetchConnectionCache = true;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const originalPool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

originalPool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export const pool = new Proxy(originalPool, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);
    
    if (prop === 'query' && typeof value === 'function') {
      return function(...args: any[]) {
        return withRetry(() => value.apply(target, args));
      };
    }
    
    if (typeof value === 'function') {
      return value.bind(target);
    }
    
    return value;
  }
});

export const db = drizzle({ client: pool, schema });
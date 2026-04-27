/**
 * Row-Level Security (RLS) Context
 *
 * Provides per-request database isolation by:
 *  1. Checking out a dedicated pg connection per authenticated request
 *  2. Setting SET SESSION app.current_user_id and app.is_superadmin on that connection
 *  3. Storing the scoped Drizzle instance in AsyncLocalStorage so ALL storage
 *     methods automatically use it without any code changes in routes
 *  4. Releasing the connection when the HTTP response finishes
 *
 * PostgreSQL RLS policies are added by scripts/apply-rls.ts.
 * Together they guarantee: even a route that forgets WHERE user_id=? returns nothing.
 */

import { AsyncLocalStorage } from "async_hooks";
import type { Request, Response, NextFunction } from "express";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PoolClient } from "pg";
import { pool } from "./db";
import * as schema from "@shared/schema";

type RlsDb = NodePgDatabase<typeof schema>;

interface RlsContext {
  db: RlsDb;
  client: PoolClient;
  userId: string;
  isSuperadmin: boolean;
}

const store = new AsyncLocalStorage<RlsContext>();

/**
 * Returns the request-scoped Drizzle instance if inside an RLS context,
 * otherwise falls back to the global pool-backed instance.
 */
export function getRlsDb(): RlsDb {
  return store.getStore()?.db ?? drizzle(pool, { schema });
}

/**
 * A Proxy-backed export of `db` that transparently delegates every method call
 * to whichever Drizzle instance is current (scoped or global).
 * Importing this instead of the global `db` is the only change needed in
 * storage.ts and routes.ts to gain full per-request isolation.
 */
export const db = new Proxy({} as RlsDb, {
  get(_target, prop) {
    return getRlsDb()[prop as keyof RlsDb];
  },
});

/**
 * Express middleware — mount AFTER session/auth middleware.
 *
 * For every authenticated request:
 *  - Checks out a dedicated connection from the pool
 *  - Sets app.current_user_id and app.is_superadmin for this session
 *  - Wraps the remainder of the request in AsyncLocalStorage so all
 *    storage calls automatically use the scoped db
 *  - Releases the connection once the response finishes
 *
 * Unauthenticated requests go through normally (no RLS context needed —
 * protected routes already reject them before hitting storage).
 */
export function rlsMiddleware(req: Request, res: Response, next: NextFunction) {
  const userId: string | undefined = (req.session as any)?.userId;
  const isSuperadmin: boolean = (req.session as any)?.isSuperadmin === true;

  if (!userId) {
    return next();
  }

  pool.connect().then((client) => {
    const rlsDb = drizzle(client, { schema });

    const release = () => {
      client.release();
    };

    res.on("finish", release);
    res.on("close", release);

    const ctx: RlsContext = { db: rlsDb, client, userId, isSuperadmin };

    // Set the session variables so RLS policies can read them.
    // Using SET SESSION (not SET LOCAL) because there is no outer transaction
    // wrapping the entire request — the variables persist on this dedicated
    // connection for the lifetime of the request, then the connection is released.
    client
      .query(
        `SELECT set_config('app.current_user_id', $1, false),
                set_config('app.is_superadmin',    $2, false)`,
        [userId, isSuperadmin ? "true" : "false"],
      )
      .then(() => {
        store.run(ctx, () => next());
      })
      .catch((err) => {
        client.release();
        console.error("[RLS] Failed to set session config:", err);
        next();
      });
  }).catch((err) => {
    console.error("[RLS] Failed to acquire pool connection:", err);
    next();
  });
}

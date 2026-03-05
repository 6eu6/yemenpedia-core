import { PrismaClient } from '@prisma/client';

/**
 * Yemenpedia Database Client
 * GOVERNANCE: Article I, Section 1.1 - Prisma Singleton Pattern
 *
 * CRITICAL IPv4 RESTRICTION:
 * - Sandbox environments ONLY support IPv4
 * - Supabase direct connections use IPv6 and WILL FAIL
 * - MUST strictly use Pooler URL (aws-1-eu-central-1.pooler.supabase.com)
 * - Direct database URLs are STRICTLY BANNED
 *
 * Uses globalThis to cache PrismaClient during Next.js hot-reloading
 * to prevent connection exhaustion with Supabase Pooler.
 */

const prismaClientSingleton = () => {
  const poolerUrl = process.env.SUPABASE_POOLER_URL;

  // STRICT GOVERNANCE ENFORCEMENT: IPv4 Pooler URL Required
  if (!poolerUrl) {
    throw new Error(
      '[GOVERNANCE VIOLATION] SUPABASE_POOLER_URL is not set. ' +
      'Database connection requires the IPv4-compatible Pooler URL. ' +
      'See STRICT_CONSTITUTION.md Article I, Section 1.1'
    );
  }

  // Detect and reject direct IPv6 URLs (non-pooler)
  // Direct Supabase URLs contain: db.{project-ref}.supabase.co
  // Pooler URLs contain: aws-1-eu-central-1.pooler.supabase.com
  const isDirectUrl = poolerUrl.includes('.supabase.co') && !poolerUrl.includes('pooler');
  const isPoolerUrl = poolerUrl.includes('pooler.supabase.com');

  if (isDirectUrl) {
    throw new Error(
      '[GOVERNANCE VIOLATION] Direct database URL detected! ' +
      'IPv6 connections are NOT supported in sandbox environment. ' +
      'MUST use SUPABASE_POOLER_URL with pooler.supabase.com endpoint. ' +
      'See STRICT_CONSTITUTION.md Article I, Section 1.1'
    );
  }

  if (!isPoolerUrl) {
    console.warn(
      '[WARNING] Database URL does not appear to be a Supabase Pooler URL. ' +
      'Ensure you are using the correct IPv4-compatible endpoint.'
    );
  }

  // Detect and reject SQLite (strictly banned)
  if (poolerUrl.startsWith('file:') || poolerUrl.includes('sqlite')) {
    throw new Error(
      '[GOVERNANCE VIOLATION] SQLite is STRICTLY BANNED. ' +
      'Must use PostgreSQL via Supabase Pooler. ' +
      'See STRICT_CONSTITUTION.md Article I, Section 1.1'
    );
  }

  // Build URL with connection pooling parameters for Supabase Session Mode
  const connectionUrl = poolerUrl.includes('?')
    ? `${poolerUrl}&pgbouncer=true&connection_limit=1&pool_timeout=20`
    : `${poolerUrl}?pgbouncer=true&connection_limit=1&pool_timeout=20`;

  return new PrismaClient({
    datasources: {
      db: { url: connectionUrl },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Use cached client in development to prevent connection exhaustion
const db = globalThis.prismaGlobal ?? prismaClientSingleton();

export default db;
export { db };

// Cache client in development mode
if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = db;
}

/**
 * Yemenpedia Database Client
 * 
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

import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  // Use DATABASE_URL from environment (with pgbouncer already in .env)
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error(
      '[CONFIGURATION ERROR] DATABASE_URL environment variable is not set. ' +
      'Please check your .env file.'
    )
  }

  // STRICT GOVERNANCE ENFORCEMENT: IPv4 Pooler URL Required
  // Pooler URLs contain: pooler.supabase.com
  const isPoolerUrl = databaseUrl.includes('pooler.supabase.com') || databaseUrl.includes('pooler')

  // Check for direct Supabase URL (IPv6 - will fail)
  const isDirectUrl = databaseUrl.includes('.supabase.co') && !databaseUrl.includes('pooler')

  if (isDirectUrl) {
    throw new Error(
      '[GOVERNANCE VIOLATION] Direct database URL detected! ' +
      'IPv6 connections are NOT supported in sandbox environment. ' +
      'MUST use DATABASE_URL with pooler.supabase.com endpoint. ' +
      'See STRICT_CONSTITUTION.md Article I, Section 1.1'
    )
  }

  if (!isPoolerUrl && !databaseUrl.startsWith('file:')) {
    console.warn(
      '[WARNING] Database URL does not appear to be a Supabase Pooler URL. ' +
      'Ensure you are using the correct IPv4-compatible endpoint.'
    )
  }

  // Ensure pgbouncer parameter is set for pooler connections
  let connectionUrl = databaseUrl
  if (isPoolerUrl && !databaseUrl.includes('pgbouncer=')) {
    connectionUrl = databaseUrl.includes('?')
      ? `${databaseUrl}&pgbouncer=true`
      : `${databaseUrl}?pgbouncer=true`
  }

  return new PrismaClient({
    datasources: {
      db: { url: connectionUrl },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

// Use cached client in development to prevent connection exhaustion
const db = globalThis.prismaGlobal ?? prismaClientSingleton()

export default db
export { db }

// Cache client in development mode
if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = db
}

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
  const databaseUrl = process.env.SUPABASE_POOLER_URL

  if (!databaseUrl) {
    throw new Error(
      '[CONFIGURATION ERROR] SUPABASE_POOLER_URL environment variable is not set. ' +
      'Please check your .env file.'
    )
  }

  // STRICT GOVERNANCE ENFORCEMENT: IPv4 Pooler URL Required
  const isPoolerUrl = databaseUrl.includes('pooler.supabase.com')

  if (!isPoolerUrl) {
    throw new Error(
      '[GOVERNANCE VIOLATION] Database URL must be a Supabase Pooler URL! ' +
      'IPv6 connections are NOT supported in sandbox environment. ' +
      'See STRICT_CONSTITUTION.md Article I, Section 1.1'
    )
  }

  return new PrismaClient({
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

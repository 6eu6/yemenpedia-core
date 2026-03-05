/**
 * Simple Auth Helper - Cookie-based Session Extraction
 * 
 * For routes where request object is available via NextRequest
 * Returns minimal session data without full DB lookup
 */

import { cookies } from 'next/headers'
import type { Role } from '@prisma/client'

export interface SimpleSession {
  id: string
  username?: string
  email: string
  role: Role
  name?: string | null
}

/**
 * Get session from HTTP-only cookie (server-side only)
 * Use this in Server Components and API routes
 */
export async function getSessionFromCookie(): Promise<SimpleSession | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    
    if (!sessionCookie?.value) {
      return null
    }
    
    const session = JSON.parse(sessionCookie.value) as SimpleSession
    
    // Validate required fields
    if (!session.id || !session.email || !session.role) {
      return null
    }
    
    return session
  } catch {
    return null
  }
}

/**
 * Check if user has admin role
 */
export function isAdminRole(role: Role): boolean {
  return role === 'ADMIN'
}

/**
 * Check if user has moderator or higher role
 */
export function isModeratorOrHigher(role: Role): boolean {
  return role === 'ADMIN' || role === 'MODERATOR'
}

/**
 * Check if user has editor or higher role
 */
export function isEditorOrHigher(role: Role): boolean {
  return role === 'ADMIN' || role === 'MODERATOR' || role === 'EDITOR'
}

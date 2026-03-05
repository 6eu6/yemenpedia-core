/**
 * Session Helper - Inline Authentication for API Routes
 * 
 * Per Constitution V5.1: "Implement session validation Inline within the API routes"
 * 
 * This module provides utilities to:
 * 1. Extract user ID from session cookie
 * 2. Validate session exists and is not expired
 * 3. Get full user data from database
 * 
 * RULE: NEVER trust userId/authorId from request body. Always use session.
 */

import { NextRequest } from 'next/server'
import { db } from './db'
import type { Role } from '@prisma/client'

// ============================================
// Types
// ============================================

export interface SessionUser {
  id: string
  email: string
  name: string | null
  username: string | null
  image: string | null
  role: Role
  isVerified: boolean
}

export interface AuthResult {
  success: true
  user: SessionUser
}

export interface AuthError {
  success: false
  error: string
  statusCode: 401 | 403 | 500
}

// ============================================
// Session Validation
// ============================================

/**
 * Get the current authenticated user from session cookie
 * Use this at the beginning of every protected API route
 * 
 * @example
 * const auth = await getAuthUser(request)
 * if (!auth.success) {
 *   return NextResponse.json({ error: auth.error }, { status: auth.statusCode })
 * }
 * const userId = auth.user.id // Use this, NEVER trust body.userId
 */
export async function getAuthUser(request: NextRequest): Promise<AuthResult | AuthError> {
  try {
    // 1. Get session cookie
    const sessionCookie = request.cookies.get('session')
    
    if (!sessionCookie?.value) {
      return {
        success: false,
        error: 'Authentication required',
        statusCode: 401
      }
    }

    // 2. Parse session
    let sessionData: { id: string; expiresAt?: string }
    try {
      sessionData = JSON.parse(sessionCookie.value)
    } catch {
      return {
        success: false,
        error: 'Invalid session format',
        statusCode: 401
      }
    }

    // 3. Check session expiration
    if (sessionData.expiresAt) {
      const expiresAt = new Date(sessionData.expiresAt)
      if (expiresAt < new Date()) {
        return {
          success: false,
          error: 'Session expired',
          statusCode: 401
        }
      }
    }

    // 4. Get user from database
    const user = await db.user.findUnique({
      where: { id: sessionData.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        image: true,
        role: true,
        isVerified: true,
        isActive: true,
        isBanned: true,
      }
    })

    if (!user) {
      return {
        success: false,
        error: 'User not found',
        statusCode: 401
      }
    }

    // 5. Check user status
    if (!user.isActive || user.isBanned) {
      return {
        success: false,
        error: 'Account is disabled or banned',
        statusCode: 403
      }
    }

    // 6. Return safe user data (exclude sensitive fields)
    const { isActive, isBanned, ...safeUser } = user
    
    return {
      success: true,
      user: safeUser
    }
  } catch (error) {
    console.error('Auth error:', error)
    return {
      success: false,
      error: 'Internal authentication error',
      statusCode: 500
    }
  }
}

// ============================================
// Role-Based Access Control
// ============================================

/**
 * Role hierarchy for permission checks
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 100,
  MODERATOR: 75,
  EDITOR: 50,
  MEMBER: 10,
}

/**
 * Check if user has required role or higher
 * 
 * @example
 * if (!hasRole(auth.user.role, 'EDITOR')) {
 *   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
 * }
 */
export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Check if user is admin
 */
export function isAdmin(role: Role): boolean {
  return role === 'ADMIN'
}

/**
 * Check if user can moderate content
 */
export function canModerate(role: Role): boolean {
  return hasRole(role, 'MODERATOR')
}

/**
 * Check if user can edit content
 */
export function canEdit(role: Role): boolean {
  return hasRole(role, 'EDITOR')
}

// ============================================
// Quick Auth Check Helper
// ============================================

/**
 * Quick check that returns userId or null
 * Use for simple routes that just need to know who the user is
 */
export async function getUserId(request: NextRequest): Promise<string | null> {
  const auth = await getAuthUser(request)
  return auth.success ? auth.user.id : null
}

/**
 * Require authentication - throws error response if not authenticated
 * Use with async/await pattern
 * 
 * @example
 * const user = await requireAuth(request)
 * if (user instanceof NextResponse) return user // Auth failed
 * // user is now typed as SessionUser
 */
export async function requireAuth(request: NextRequest): Promise<SessionUser | Response> {
  const auth = await getAuthUser(request)
  
  if (!auth.success) {
    return Response.json(
      { error: auth.error },
      { status: auth.statusCode }
    )
  }
  
  return auth.user
}

/**
 * Admin Guard - Role-Based Access Control
 * 
 * SECURITY: ADMIN role required for all routes in this group
 * 
 * Available admin routes:
 * - /dashboard/admin/users - User management
 * - /dashboard/admin/stats - System statistics
 * - /dashboard/admin/settings - System settings
 * - /dashboard/admin/backups - Backup management
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/session'
import type { Role } from '@prisma/client'

// Role hierarchy for permission checks
export const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 100,
  MODERATOR: 75,
  EDITOR: 50,
  MEMBER: 10,
}

// Check if user has required role or higher
export function hasRequiredRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

// Guard for ADMIN-only routes
export async function guardAdmin(request: NextRequest) {
  const auth = await getAuthUser(request)
  
  if (!auth.success) {
    return { 
      authorized: false, 
      response: NextResponse.json({ error: auth.error }, { status: auth.statusCode })
    }
  }
  
  if (auth.user.role !== 'ADMIN') {
    return { 
      authorized: false, 
      response: NextResponse.json({ 
        error: 'هذه الصفحة تتطلب صلاحيات مدير' 
      }, { status: 403 })
    }
  }
  
  return { authorized: true, user: auth.user }
}

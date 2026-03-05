/**
 * Moderator Guard - Role-Based Access Control
 * 
 * SECURITY: MODERATOR+ role required for all routes in this group
 * 
 * Available moderator routes:
 * - /dashboard/moderator/reviews - Content moderation
 * - /dashboard/moderator/reports - User reports
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/session'
import { ROLE_HIERARCHY } from '../(admin)/guard'
import type { Role } from '@prisma/client'

// Guard for MODERATOR+ routes
export async function guardModerator(request: NextRequest) {
  const auth = await getAuthUser(request)
  
  if (!auth.success) {
    return { 
      authorized: false, 
      response: NextResponse.json({ error: auth.error }, { status: auth.statusCode })
    }
  }
  
  if (ROLE_HIERARCHY[auth.user.role] < ROLE_HIERARCHY.MODERATOR) {
    return { 
      authorized: false, 
      response: NextResponse.json({ 
        error: 'هذه الصفحة تتطلب صلاحيات مشرف أو أعلى' 
      }, { status: 403 })
    }
  }
  
  return { authorized: true, user: auth.user }
}

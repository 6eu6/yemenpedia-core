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
import { ROLE_NAMES, getRoleLevel, type RoleName } from '@/config/roles.config'

// Guard for MODERATOR+ routes
export async function guardModerator(request: NextRequest) {
  const auth = await getAuthUser(request)

  if (!auth.success) {
    return {
      authorized: false,
      response: NextResponse.json({ error: auth.error }, { status: auth.statusCode })
    }
  }

  if (getRoleLevel(auth.user.role) < getRoleLevel(ROLE_NAMES.MODERATOR)) {
    return {
      authorized: false,
      response: NextResponse.json({
        error: 'هذه الصفحة تتطلب صلاحيات مشرف أو أعلى'
      }, { status: 403 })
    }
  }

  return { authorized: true, user: auth.user }
}

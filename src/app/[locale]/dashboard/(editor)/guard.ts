/**
 * Editor Guard - Role-Based Access Control
 *
 * SECURITY: EDITOR+ role required for all routes in this group
 *
 * Available editor routes:
 * - /dashboard/editor/drafts - Draft management
 * - /dashboard/editor/scheduled - Scheduled articles
 * - /dashboard/editor/analytics - Content analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/session'
import { ROLE_NAMES, getRoleLevel, type RoleName } from '@/config/roles.config'

// Guard for EDITOR+ routes
export async function guardEditor(request: NextRequest) {
  const auth = await getAuthUser(request)

  if (!auth.success) {
    return {
      authorized: false,
      response: NextResponse.json({ error: auth.error }, { status: auth.statusCode })
    }
  }

  if (getRoleLevel(auth.user.role) < getRoleLevel(ROLE_NAMES.EDITOR)) {
    return {
      authorized: false,
      response: NextResponse.json({
        error: 'هذه الصفحة تتطلب صلاحيات محرر أو أعلى'
      }, { status: 403 })
    }
  }

  return { authorized: true, user: auth.user }
}

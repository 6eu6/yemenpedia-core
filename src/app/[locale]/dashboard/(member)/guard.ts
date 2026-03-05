/**
 * Member Guard - Role-Based Access Control
 * 
 * SECURITY: MEMBER+ role required (all authenticated users)
 * 
 * Available member routes:
 * - /dashboard/member/bookmarks - Saved articles
 * - /dashboard/member/history - Reading history
 * - /dashboard/member/preferences - User preferences
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/session'

// Guard for MEMBER+ routes (all authenticated users)
export async function guardMember(request: NextRequest) {
  const auth = await getAuthUser(request)
  
  if (!auth.success) {
    return { 
      authorized: false, 
      response: NextResponse.json({ error: auth.error }, { status: auth.statusCode })
    }
  }
  
  return { authorized: true, user: auth.user }
}

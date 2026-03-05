/**
 * Follow API - SECURED
 * 
 * Security Fixes Applied:
 * 1. followerId is taken from session, NOT from request body
 * 2. Only the authenticated user can follow/unfollow others
 * 3. Self-follow is prevented
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { getAuthUser } from '@/lib/session'

// Only followingId from body - followerId from session
const followSchema = z.object({
  followingId: z.string().min(1, 'معرف المستخدم مطلوب')
})

const followQuerySchema = z.object({
  userId: z.string().optional(),
  currentUserId: z.string().optional()
})

// Toggle follow/unfollow
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Get follower from session
    const auth = await getAuthUser(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode })
    }
    
    const followerId = auth.user.id // Use session user ID

    const body = await request.json()
    const validation = followSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'البيانات غير صالحة',
          details: validation.error.flatten() 
        },
        { status: 400 }
      )
    }
    
    const { followingId } = validation.data

    // SECURITY: Prevent self-follow
    if (followerId === followingId) {
      return NextResponse.json({ error: 'لا يمكنك متابعة نفسك' }, { status: 400 })
    }

    // Verify the user to follow exists
    const userToFollow = await db.user.findUnique({
      where: { id: followingId }
    })

    if (!userToFollow) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    // Check if already following
    const existing = await db.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId }
      }
    })

    if (existing) {
      // Unfollow
      await db.follow.delete({
        where: { id: existing.id }
      })

      const followersCount = await db.follow.count({
        where: { followingId }
      })

      return NextResponse.json({ isFollowing: false, followersCount })
    } else {
      // Follow
      await db.follow.create({
        data: { followerId, followingId }
      })

      // Create notification
      await db.notification.create({
        data: {
          userId: followingId,
          type: 'NEW_FOLLOWER',
          title: 'متابع جديد',
          message: `${auth.user.name || auth.user.username} بدأ بمتابعتك`,
          data: { followerId }
        }
      })

      const followersCount = await db.follow.count({
        where: { followingId }
      })

      return NextResponse.json({ isFollowing: true, followersCount })
    }
  } catch (error) {
    console.error('Follow error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// Get follow data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') ?? undefined
    const currentUserId = searchParams.get('currentUserId') ?? undefined

    const validation = followQuerySchema.safeParse({ userId, currentUserId })

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'البيانات غير صالحة',
          details: validation.error.flatten() 
        },
        { status: 400 }
      )
    }

    const { userId: validatedUserId, currentUserId: validatedCurrentUserId } = validation.data

    // If userId is not provided, use current user from session
    let targetUserId = validatedUserId
    if (!targetUserId) {
      const auth = await getAuthUser(request)
      if (auth.success) {
        targetUserId = auth.user.id
      } else {
        return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 })
      }
    }

    const followersCount = await db.follow.count({
      where: { followingId: targetUserId }
    })

    const followingCount = await db.follow.count({
      where: { followerId: targetUserId }
    })

    let isFollowing = false
    if (validatedCurrentUserId && validatedCurrentUserId !== targetUserId) {
      const follow = await db.follow.findUnique({
        where: {
          followerId_followingId: { followerId: validatedCurrentUserId, followingId: targetUserId }
        }
      })
      isFollowing = !!follow
    }

    return NextResponse.json({ followersCount, followingCount, isFollowing })
  } catch (error) {
    console.error('Get follow data error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

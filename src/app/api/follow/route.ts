import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { followSchema, followQuerySchema } from '@/lib/validations'

// Toggle follow/unfollow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body with Zod
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
    
    const { followerId, followingId } = validation.data

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

    // Validate query parameters with Zod
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

    const followersCount = await db.follow.count({
      where: { followingId: validatedUserId }
    })

    const followingCount = await db.follow.count({
      where: { followerId: validatedUserId }
    })

    let isFollowing = false
    if (validatedCurrentUserId && validatedCurrentUserId !== validatedUserId) {
      const follow = await db.follow.findUnique({
        where: {
          followerId_followingId: { followerId: validatedCurrentUserId, followingId: validatedUserId }
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

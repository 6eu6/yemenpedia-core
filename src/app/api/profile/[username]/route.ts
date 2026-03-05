import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Create fresh Prisma Client
const prisma = new PrismaClient()

// API: Get public user profile by username
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const { searchParams } = new URL(request.url)
    const currentUserId = searchParams.get('currentUserId')

    if (!username) {
      return NextResponse.json({ error: 'اسم المستخدم مطلوب' }, { status: 400 })
    }

    // Find user by username
    const user = await prisma.user.findFirst({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        coverImage: true,
        bio: true,
        location: true,
        website: true,
        socialLinks: true,
        role: true,
        points: true,
        isVerified: true,
        createdAt: true,
        badges: {
          select: {
            badgeType: true,
            earnedAt: true
          },
          orderBy: { earnedAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            articles: {
              where: { status: 'APPROVED' }
            }
          }
        },
        articles: {
          where: { status: 'APPROVED' },
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            viewCount: true,
            likeCount: true,
            createdAt: true,
            category: {
              select: { name: true, slug: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    // Get follow counts
    const followersCount = await prisma.follow.count({
      where: { followingId: user.id }
    })

    const followingCount = await prisma.follow.count({
      where: { followerId: user.id }
    })

    // Check if current user is following this user
    let isFollowing = false
    if (currentUserId && currentUserId !== user.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: { followerId: currentUserId, followingId: user.id }
        }
      })
      isFollowing = !!follow
    }

    // Check verification request status (for profile owner)
    let verificationStatus: string | null = null
    if (currentUserId === user.id) {
      const request = await prisma.verificationRequest.findUnique({
        where: { userId: user.id }
      })
      verificationStatus = request?.status || null
    }

    return NextResponse.json({
      user: {
        ...user,
        articleCount: user._count.articles,
        followersCount,
        followingCount,
        isFollowing,
        verificationStatus
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

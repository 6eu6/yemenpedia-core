import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// API: Get public user profile by username
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    if (!username) {
      return NextResponse.json({ error: 'اسم المستخدم مطلوب' }, { status: 400 })
    }

    // Find user by username - ONLY return public data (NO email)
    const user = await db.user.findFirst({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
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
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        ...user,
        articleCount: user._count.articles
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

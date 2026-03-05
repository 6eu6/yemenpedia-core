import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId مطلوب' }, { status: 400 })
    }

    const articles = await db.article.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        title: true,
        status: true,
        viewCount: true,
        likeCount: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    const stats = await db.article.aggregate({
      where: { authorId: userId },
      _sum: {
        viewCount: true,
        likeCount: true
      },
      _count: true
    })

    return NextResponse.json({
      articles,
      stats: {
        articleCount: stats._count,
        viewCount: stats._sum.viewCount || 0,
        likeCount: stats._sum.likeCount || 0
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

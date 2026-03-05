import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Public API - Articles List
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'APPROVED'
    const categoryId = searchParams.get('categoryId')
    const governorateId = searchParams.get('governorateId')
    const authorId = searchParams.get('authorId')
    const tag = searchParams.get('tag')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit
    const sort = searchParams.get('sort') || 'createdAt'
    const order = searchParams.get('order') || 'desc'

    const where: any = { status: 'APPROVED' }
    if (categoryId) where.categoryId = categoryId
    if (governorateId) where.governorateId = governorateId
    if (authorId) where.authorId = authorId
    if (tag) {
      where.tags = {
        some: {
          tag: { slug: tag }
        }
      }
    }

    const orderBy: any = {}
    orderBy[sort] = order

    const [articles, total] = await Promise.all([
      db.article.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          viewCount: true,
          likeCount: true,
          createdAt: true,
          publishedAt: true,
          author: {
            select: { id: true, name: true }
          },
          category: {
            select: { id: true, name: true, slug: true }
          },
          governorate: {
            select: { id: true, name: true }
          },
          tags: {
            select: {
              tag: { select: { id: true, name: true, slug: true } }
            }
          }
        },
        orderBy,
        take: limit,
        skip
      }),
      db.article.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: articles.map(a => ({
        ...a,
        tags: a.tags.map(t => t.tag)
      })),
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300'
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Public API - Search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const type = searchParams.get('type') || 'all' // all | articles | categories | governorates
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

    if (!q || q.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'يجب أن يكون البحث حرفين على الأقل'
      }, { status: 400 })
    }

    const results: any = {}

    // Search articles
    if (type === 'all' || type === 'articles') {
      results.articles = await db.article.findMany({
        where: {
          status: 'APPROVED',
          OR: [
            { title: { contains: q } },
            { excerpt: { contains: q } },
            { content: { contains: q } }
          ]
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          category: { select: { name: true } }
        },
        take: limit
      })
    }

    // Search categories
    if (type === 'all' || type === 'categories') {
      results.categories = await db.category.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q } },
            { description: { contains: q } }
          ]
        },
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          articleCount: true
        },
        take: limit
      })
    }

    // Search governorates
    if (type === 'all' || type === 'governorates') {
      results.governorates = await db.governorate.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { nameEn: { contains: q } },
            { capital: { contains: q } }
          ]
        },
        select: {
          id: true,
          name: true,
          nameEn: true,
          capital: true,
          articleCount: true
        },
        take: limit
      })
    }

    return NextResponse.json({
      success: true,
      query: q,
      results
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في البحث' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Latest Articles API
 * Returns most recent published articles (excludes soft-deleted)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 20)

    // Fetch latest published articles (exclude soft-deleted)
    const articles = await db.article.findMany({
      where: {
        status: 'APPROVED',
        deletedAt: null // Soft delete filter
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        viewCount: true,
        likeCount: true,
        createdAt: true,
        publishedAt: true,
        content: true,
        featuredImage: true,
        category: {
          select: {
            name: true,
            slug: true
          }
        },
        media: {
          where: { type: 'IMAGE' },
          select: { url: true },
          take: 1
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: limit
    })

    // Format response
    const formattedArticles = articles.map(article => {
      // Estimate read time from content
      const contentLength = article.content ? JSON.stringify(article.content).length : 0
      const wordCount = Math.ceil(contentLength / 5)
      const readTime = Math.max(1, Math.ceil(wordCount / 200))

      return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt || '',
        category: article.category ? { name: article.category.name, slug: article.category.slug } : null,
        featuredImage: article.featuredImage || (article.media[0]?.url) || null,
        createdAt: article.createdAt.toISOString(),
        publishedAt: article.publishedAt?.toISOString() || article.createdAt.toISOString(),
        readTime,
        viewCount: article.viewCount,
        likeCount: article.likeCount
      }
    })

    return NextResponse.json({
      articles: formattedArticles,
      count: formattedArticles.length
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60'
      }
    })
  } catch {
    // Return empty array on error
    return NextResponse.json({
      articles: [],
      count: 0
    }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=10'
      }
    })
  }
}

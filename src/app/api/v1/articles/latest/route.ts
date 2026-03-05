import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GOVERNANCE: Real articles from database - NO HARDCODED ARTICLES
// Article III, Section 3.1: Zero Placeholder Policy
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 20)

    // Fetch latest published articles
    const articles = await db.article.findMany({
      where: {
        status: 'APPROVED'
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
      const wordCount = Math.ceil(contentLength / 5) // Approximate word count
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
        'Cache-Control': 'public, max-age=60' // Cache for 1 minute
      }
    })
  } catch (error) {
    console.error('Latest Articles API Error:', error)

    // GOVERNANCE: Return empty array on error - NO FAKE ARTICLES
    return NextResponse.json({
      articles: [],
      count: 0
    }, {
      status: 200, // Return 200 with empty array
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=10'
      }
    })
  }
}

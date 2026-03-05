import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GOVERNANCE: Real statistics from database - NO FAKE NUMBERS
// Article III, Section 3.1: Zero Placeholder Policy
export async function GET() {
  try {
    // Fetch real counts from database
    const [
      articleCount,
      contributorCount,
      categoryCount,
      governorateCount
    ] = await Promise.all([
      db.article.count({
        where: { status: 'APPROVED' }
      }),
      db.user.count({
        where: {
          isActive: true,
          isBanned: false,
          role: { in: ['WRITER', 'TRANSLATOR', 'SUPERVISOR', 'VERIFIER', 'ADMIN'] }
        }
      }),
      db.category.count({
        where: { isActive: true }
      }),
      db.governorate.count()
    ])

    return NextResponse.json({
      articles: articleCount,
      contributors: contributorCount,
      categories: categoryCount,
      governorates: governorateCount
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60' // Cache for 1 minute
      }
    })
  } catch (error) {
    console.error('Stats API Error:', error)

    // GOVERNANCE: Return zeros on error - NO FAKE NUMBERS
    return NextResponse.json({
      articles: 0,
      contributors: 0,
      categories: 0,
      governorates: 0
    }, {
      status: 200, // Return 200 with zeros instead of error
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=10'
      }
    })
  }
}

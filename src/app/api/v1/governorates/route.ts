import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Public API - Governorates List
export async function GET(request: NextRequest) {
  try {
    const governorates = await db.governorate.findMany({
      select: {
        id: true,
        name: true,
        nameEn: true,
        capital: true,
        population: true,
        area: true,
        coordinates: true,
        articleCount: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: governorates
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
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

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Public API - Categories List
export async function GET(request: NextRequest) {
  try {
    const categories = await db.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        nameEn: true,
        slug: true,
        description: true,
        icon: true,
        parentId: true,
        articleCount: true,
        createdAt: true
      },
      orderBy: { order: 'asc' }
    })

    // Build tree structure
    const buildTree = (items: any[], parentId: string | null = null) => {
      return items
        .filter(item => item.parentId === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id)
        }))
    }

    const tree = buildTree(categories)

    return NextResponse.json({
      success: true,
      data: {
        flat: categories,
        tree
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromCookie } from '@/lib/auth-helper'

/**
 * Soft delete article (sets deletedAt timestamp)
 * - Authors can delete their own drafts
 * - Admins can delete any article
 * - Published articles require admin privileges
 * 
 * PERFORMANCE: Uses batch operations instead of sequential loops
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get session for auth
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Find article
    const article = await db.article.findUnique({
      where: { id }
    })

    if (!article || article.deletedAt) {
      return NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 })
    }

    // Check permissions
    const isAuthor = article.authorId === session.id
    const isAdmin = session.role === 'ADMIN'
    const isModerator = session.role === 'MODERATOR'

    // Only author, admin, or moderator can delete
    if (!isAuthor && !isAdmin && !isModerator) {
      return NextResponse.json({ error: 'غير مصرح لك بحذف هذا المقال' }, { status: 403 })
    }

    // Published articles require admin/moderator
    if (article.status === 'APPROVED' && !isAdmin && !isModerator) {
      return NextResponse.json({ error: 'لا يمكن حذف مقال منشور بدون صلاحيات الإدارة' }, { status: 403 })
    }

    // PERFORMANCE: Use transaction for batch operations
    await db.$transaction(async (tx) => {
      // Soft delete - set deletedAt timestamp
      await tx.article.update({
        where: { id },
        data: { 
          deletedAt: new Date(),
          status: 'ARCHIVED'
        }
      })

      // Decrement category article count
      await tx.category.update({
        where: { id: article.categoryId },
        data: { articleCount: { decrement: 1 } }
      })

      // PERFORMANCE: Batch decrement tag counts (was N+1)
      const articleTags = await tx.articleTag.findMany({
        where: { articleId: id },
        select: { tagId: true }
      })

      if (articleTags.length > 0) {
        await tx.tag.updateMany({
          where: { id: { in: articleTags.map(at => at.tagId) } },
          data: { articleCount: { decrement: 1 } }
        })
      }
    })

    return NextResponse.json({ success: true, message: 'تم حذف المقال' })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ أثناء الحذف' }, { status: 500 })
  }
}

/**
 * Get single article by ID
 * Excludes soft-deleted articles for non-admin users
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSessionFromCookie()
    const isAdmin = session?.role === 'ADMIN' || session?.role === 'MODERATOR'

    const article = await db.article.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, username: true, image: true } },
        category: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: true } }
      }
    })

    // Not found or soft-deleted (non-admin can't see deleted)
    if (!article || (!isAdmin && article.deletedAt)) {
      return NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 })
    }

    return NextResponse.json({ article })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

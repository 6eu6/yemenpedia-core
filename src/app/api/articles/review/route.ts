/**
 * Article Review API - SECURED
 * 
 * Security Fixes Applied:
 * 1. reviewerId is taken from session, NOT from request body
 * 2. Only users with EDITOR+ role can review articles
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { getAuthUser, canEdit, canModerate } from '@/lib/session'

const reviewSchema = z.object({
  articleId: z.string(),
  status: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Get reviewer from session
    const auth = await getAuthUser(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode })
    }

    const reviewerId = auth.user.id
    const reviewerRole = auth.user.role

    // SECURITY: Only EDITOR+ can review articles
    if (!canEdit(reviewerRole)) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لمراجعة المقالات' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = reviewSchema.parse(body)

    // Get article
    const article = await db.article.findUnique({
      where: { id: validatedData.articleId },
      include: { author: true }
    })

    if (!article) {
      return NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 })
    }

    if (article.status !== 'PENDING') {
      return NextResponse.json({ error: 'هذا المقال ليس قيد المراجعة' }, { status: 400 })
    }

    // Update article status
    const updatedArticle = await db.article.update({
      where: { id: validatedData.articleId },
      data: {
        status: validatedData.status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: validatedData.notes,
        publishedAt: validatedData.status === 'APPROVED' ? new Date() : null
      }
    })

    // Create review record
    await db.articleReview.create({
      data: {
        articleId: validatedData.articleId,
        reviewerId: reviewerId,
        status: validatedData.status,
        notes: validatedData.notes
      }
    })

    // Create notification for author
    await db.notification.create({
      data: {
        userId: article.authorId,
        type: validatedData.status === 'APPROVED' ? 'ARTICLE_APPROVED' : 'ARTICLE_REJECTED',
        title: validatedData.status === 'APPROVED' ? 'تم قبول مقالك' : 'تم رفض مقالك',
        message: validatedData.status === 'APPROVED'
          ? `تم نشر مقالك "${article.title}" بنجاح`
          : `تم رفض مقالك "${article.title}". ${validatedData.notes || ''}`,
        data: { articleId: validatedData.articleId }
      }
    })

    // Award points if approved
    if (validatedData.status === 'APPROVED') {
      await db.user.update({
        where: { id: article.authorId },
        data: { points: { increment: 10 } }
      })

      await db.notification.create({
        data: {
          userId: article.authorId,
          type: 'POINTS_EARNED',
          title: 'حصلت على نقاط!',
          message: 'حصلت على 10 نقاط لنشر مقالك',
          data: { points: 10, reason: 'article_published' }
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: validatedData.status === 'APPROVED' ? 'تم نشر المقال' : 'تم رفض المقال',
      article: updatedArticle
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'حدث خطأ أثناء مراجعة المقال' }, { status: 500 })
  }
}

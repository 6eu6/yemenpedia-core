import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const reviewSchema = z.object({
  articleId: z.string(),
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewerId: z.string(),
  notes: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = reviewSchema.parse(body)

    // Verify reviewer exists and has permission
    const reviewer = await db.user.findUnique({
      where: { id: validatedData.reviewerId }
    })

    if (!reviewer) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 401 })
    }

    if (!['ADMIN', 'VERIFIER', 'SUPERVISOR'].includes(reviewer.role)) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لمراجعة المقالات' }, { status: 403 })
    }

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
        reviewedBy: validatedData.reviewerId,
        reviewedAt: new Date(),
        reviewNotes: validatedData.notes,
        publishedAt: validatedData.status === 'APPROVED' ? new Date() : null
      }
    })

    // Create review record
    await db.articleReview.create({
      data: {
        articleId: validatedData.articleId,
        reviewerId: validatedData.reviewerId,
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

      // Create points notification
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
    console.error('Review error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء مراجعة المقال' }, { status: 500 })
  }
}

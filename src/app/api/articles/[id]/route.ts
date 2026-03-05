import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// حذف مسودة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { authorId } = body

    if (!authorId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // التحقق من وجود المقال وملكيته
    const article = await db.article.findUnique({
      where: { id }
    })

    if (!article) {
      return NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 })
    }

    if (article.authorId !== authorId) {
      return NextResponse.json({ error: 'غير مصرح لك بحذف هذا المقال' }, { status: 403 })
    }

    // لا يمكن حذف المقالات المنشورة
    if (article.status === 'APPROVED') {
      return NextResponse.json({ error: 'لا يمكن حذف مقال منشور' }, { status: 400 })
    }

    // حذف الوسوم المرتبطة
    const articleTags = await db.articleTag.findMany({
      where: { articleId: id }
    })

    for (const at of articleTags) {
      await db.tag.update({
        where: { id: at.tagId },
        data: { articleCount: { decrement: 1 } }
      })
    }

    await db.articleTag.deleteMany({ where: { articleId: id } })

    // حذف المقال
    await db.article.delete({ where: { id } })

    // تحديث عدد مقالات القسم
    await db.category.update({
      where: { id: article.categoryId },
      data: { articleCount: { decrement: 1 } }
    })

    return NextResponse.json({ success: true, message: 'تم حذف المسودة' })
  } catch (error) {
    console.error('Delete article error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء الحذف' }, { status: 500 })
  }
}

// جلب مقال واحد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const article = await db.article.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: true } }
      }
    })

    if (!article) {
      return NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 })
    }

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Get article error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

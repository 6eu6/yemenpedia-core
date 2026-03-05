import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createArticleSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب').optional(), // اختياري للمسودات الأولية
  excerpt: z.string().optional(),
  content: z.any().optional(), // TipTap JSON content
  categoryId: z.string().optional(), // اختياري للمسودات
  governorateId: z.string().nullish(),
  tags: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING']).default('DRAFT'),
  authorId: z.string(),
  featuredImage: z.string().nullish(),
  featuredImageAlt: z.string().nullish(),
  // SEO fields
  metaTitle: z.string().nullish(),
  metaDescription: z.string().nullish(),
  keywords: z.string().nullish(),
  slug: z.string().optional(), // للتوافق
})

// مخطط تحديث المسودة - حقول اختيارية
const updateArticleSchema = z.object({
  articleId: z.string(),
  title: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.any().optional(),
  categoryId: z.string().nullish(),
  governorateId: z.string().nullish(),
  tags: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING']).optional(),
  authorId: z.string(),
  featuredImage: z.string().nullish(),
  featuredImageAlt: z.string().nullish(),
  // SEO fields
  metaTitle: z.string().nullish(),
  metaDescription: z.string().nullish(),
  keywords: z.string().nullish()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const categoryId = searchParams.get('categoryId')
    const authorId = searchParams.get('authorId')
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status
    if (categoryId) where.categoryId = categoryId
    if (authorId) where.authorId = authorId

    const [articles, total] = await Promise.all([
      db.article.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: { select: { id: true, name: true, slug: true } },
          tags: { include: { tag: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      }),
      db.article.count({ where })
    ])

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get articles error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createArticleSchema.parse(body)

    const authorId = validatedData.authorId

    if (!authorId) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول لكتابة مقال' }, { status: 401 })
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: authorId } })
    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 401 })
    }

    // للنشر النهائي، يجب اختيار قسم
    if (validatedData.status === 'PENDING' && !validatedData.categoryId) {
      return NextResponse.json({ error: 'يجب اختيار قسم للنشر' }, { status: 400 })
    }

    // Generate slug from title
    const titleText = validatedData.title || 'مسودة'
    const slug = titleText
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100) || `draft-${Date.now()}`

    // Check slug uniqueness
    const existingArticle = await db.article.findUnique({ where: { slug } })
    const uniqueSlug = existingArticle ? `${slug}-${Date.now()}` : slug

    // بيانات المقال
    const articleData: any = {
      title: validatedData.title || 'مسودة بدون عنوان',
      slug: uniqueSlug,
      excerpt: validatedData.excerpt || '',
      content: validatedData.content || {},
      authorId,
      status: validatedData.status,
      primaryLang: 'ar',
      featuredImage: validatedData.featuredImage || null,
      featuredImageAlt: validatedData.featuredImageAlt || null,
      // SEO fields
      metaTitle: validatedData.metaTitle || null,
      metaDescription: validatedData.metaDescription || null,
      keywords: validatedData.keywords || null
    }

    // إضافة المحافظة إذا تم تحديدها
    if (validatedData.governorateId) {
      articleData.governorateId = validatedData.governorateId
    }

    // إضافة القسم إذا تم تحديده
    if (validatedData.categoryId) {
      articleData.categoryId = validatedData.categoryId
    } else {
      // استخدام قسم افتراضي للمسودات (أول قسم موجود)
      const defaultCategory = await db.category.findFirst()
      if (defaultCategory) {
        articleData.categoryId = defaultCategory.id
      }
    }

    // Create article
    const article = await db.article.create({
      data: articleData
    })

    // Handle tags
    if (validatedData.tags) {
      const tagNames = validatedData.tags.split(',').map(t => t.trim()).filter(Boolean)
      
      for (const tagName of tagNames) {
        const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-')
        
        let tag = await db.tag.findUnique({ where: { slug: tagSlug } })
        
        if (!tag) {
          tag = await db.tag.create({
            data: { name: tagName, slug: tagSlug }
          })
        }

        await db.articleTag.create({
          data: { articleId: article.id, tagId: tag.id }
        })

        await db.tag.update({
          where: { id: tag.id },
          data: { articleCount: { increment: 1 } }
        })
      }
    }

    // Update category article count
    if (articleData.categoryId) {
      await db.category.update({
        where: { id: articleData.categoryId },
        data: { articleCount: { increment: 1 } }
      })
    }

    // Award points for article submission
    await db.user.update({
      where: { id: validatedData.authorId },
      data: { points: { increment: 10 } }
    })

    return NextResponse.json({
      success: true,
      message: validatedData.status === 'PENDING' 
        ? 'تم إرسال المقال للمراجعة' 
        : 'تم حفظ المسودة',
      article
    })
  } catch (error) {
    console.error('Create article error:', error)
    
    // تحسين معالجة الخطأ
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return NextResponse.json({ 
        error: firstError?.message || 'خطأ في البيانات' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء المقال' 
    }, { status: 500 })
  }
}

// تحديث مسودة موجودة
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = updateArticleSchema.parse(body)

    // التحقق من وجود المقال وملكيته للمستخدم
    const existingArticle = await db.article.findUnique({
      where: { id: validatedData.articleId }
    })

    if (!existingArticle) {
      return NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 })
    }

    if (existingArticle.authorId !== validatedData.authorId) {
      return NextResponse.json({ error: 'غير مصرح لك بتعديل هذا المقال' }, { status: 403 })
    }

    // لا يمكن تعديل المقالات المنشورة أو قيد المراجعة (فقط المسودات)
    if (existingArticle.status === 'APPROVED') {
      return NextResponse.json({ error: 'لا يمكن تعديل مقال منشور' }, { status: 400 })
    }

    // بناء بيانات التحديث
    const updateData: any = {}
    if (validatedData.title) {
      updateData.title = validatedData.title
      // تحديث الـ slug إذا تغير العنوان
      const newSlug = validatedData.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100)
      
      const slugExists = await db.article.findFirst({
        where: { slug: newSlug, NOT: { id: validatedData.articleId } }
      })
      updateData.slug = slugExists ? `${newSlug}-${Date.now()}` : newSlug
    }
    if (validatedData.excerpt !== undefined) updateData.excerpt = validatedData.excerpt
    if (validatedData.content !== undefined) updateData.content = validatedData.content
    if (validatedData.categoryId) updateData.categoryId = validatedData.categoryId
    if (validatedData.status) updateData.status = validatedData.status
    if (validatedData.featuredImage !== undefined) updateData.featuredImage = validatedData.featuredImage
    if (validatedData.featuredImageAlt !== undefined) updateData.featuredImageAlt = validatedData.featuredImageAlt
    if (validatedData.governorateId !== undefined) updateData.governorateId = validatedData.governorateId
    // SEO fields
    if (validatedData.metaTitle !== undefined) updateData.metaTitle = validatedData.metaTitle
    if (validatedData.metaDescription !== undefined) updateData.metaDescription = validatedData.metaDescription
    if (validatedData.keywords !== undefined) updateData.keywords = validatedData.keywords

    // تحديث المقال
    const updatedArticle = await db.article.update({
      where: { id: validatedData.articleId },
      data: updateData
    })

    // تحديث الوسوم إذا تم توفيرها
    if (validatedData.tags !== undefined) {
      // حذف الوسوم القديمة
      const oldTags = await db.articleTag.findMany({
        where: { articleId: validatedData.articleId }
      })
      
      for (const oldTag of oldTags) {
        await db.tag.update({
          where: { id: oldTag.tagId },
          data: { articleCount: { decrement: 1 } }
        })
      }
      
      await db.articleTag.deleteMany({
        where: { articleId: validatedData.articleId }
      })

      // إضافة الوسوم الجديدة
      const tagNames = validatedData.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      
      for (const tagName of tagNames) {
        const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-')
        
        let tag = await db.tag.findUnique({ where: { slug: tagSlug } })
        
        if (!tag) {
          tag = await db.tag.create({
            data: { name: tagName, slug: tagSlug }
          })
        }

        await db.articleTag.create({
          data: { articleId: validatedData.articleId, tagId: tag.id }
        })

        await db.tag.update({
          where: { id: tag.id },
          data: { articleCount: { increment: 1 } }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: validatedData.status === 'PENDING' 
        ? 'تم إرسال المقال للمراجعة' 
        : 'تم حفظ المسودة',
      article: updatedArticle
    })
  } catch (error) {
    console.error('Update article error:', error)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues?.[0]
      return NextResponse.json({ 
        error: firstError?.message || 'خطأ في البيانات' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث المقال' 
    }, { status: 500 })
  }
}

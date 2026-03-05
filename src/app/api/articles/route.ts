/**
 * Articles API - SECURED
 * 
 * Security Fixes Applied:
 * 1. authorId is taken from session, NOT from request body
 * 2. User must be authenticated to create/update articles
 * 3. Only article owner or admin can update articles
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { getAuthUser, canEdit } from '@/lib/session'

// ============================================
// Validation Schemas (authorId removed - taken from session)
// ============================================

const createArticleSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب').optional(),
  excerpt: z.string().optional(),
  content: z.any().optional(),
  categoryId: z.string().optional(),
  governorateId: z.string().nullish(),
  tags: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING']).default('DRAFT'),
  featuredImage: z.string().nullish(),
  featuredImageAlt: z.string().nullish(),
  metaTitle: z.string().nullish(),
  metaDescription: z.string().nullish(),
  keywords: z.string().nullish(),
  slug: z.string().optional(),
})

const updateArticleSchema = z.object({
  articleId: z.string(),
  title: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.any().optional(),
  categoryId: z.string().nullish(),
  governorateId: z.string().nullish(),
  tags: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING']).optional(),
  featuredImage: z.string().nullish(),
  featuredImageAlt: z.string().nullish(),
  metaTitle: z.string().nullish(),
  metaDescription: z.string().nullish(),
  keywords: z.string().nullish()
})

// ============================================
// GET Articles (Public)
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const categoryId = searchParams.get('categoryId')
    const authorId = searchParams.get('authorId')
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
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
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// ============================================
// POST Create Article (Authenticated)
// ============================================

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Get user from session, NOT from body
    const auth = await getAuthUser(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode })
    }
    
    const userId = auth.user.id // Use session user ID

    const body = await request.json()
    const validatedData = createArticleSchema.parse(body)

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
    const articleData: Record<string, unknown> = {
      title: validatedData.title || 'مسودة بدون عنوان',
      slug: uniqueSlug,
      excerpt: validatedData.excerpt || '',
      content: validatedData.content || {},
      authorId: userId, // SECURITY: Use session user ID
      status: validatedData.status,
      primaryLang: 'ar',
      featuredImage: validatedData.featuredImage || null,
      featuredImageAlt: validatedData.featuredImageAlt || null,
      metaTitle: validatedData.metaTitle || null,
      metaDescription: validatedData.metaDescription || null,
      keywords: validatedData.keywords || null
    }

    if (validatedData.governorateId) {
      articleData.governorateId = validatedData.governorateId
    }

    if (validatedData.categoryId) {
      articleData.categoryId = validatedData.categoryId
    } else {
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
        where: { id: articleData.categoryId as string },
        data: { articleCount: { increment: 1 } }
      })
    }

    // Award points for article submission
    await db.user.update({
      where: { id: userId },
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

// ============================================
// PATCH Update Article (Owner or Editor+ only)
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    // SECURITY: Get user from session
    const auth = await getAuthUser(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode })
    }
    
    const userId = auth.user.id
    const userRole = auth.user.role

    const body = await request.json()
    const validatedData = updateArticleSchema.parse(body)

    // Get existing article
    const existingArticle = await db.article.findUnique({
      where: { id: validatedData.articleId }
    })

    if (!existingArticle) {
      return NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 })
    }

    // SECURITY: Check ownership or editor+ role
    const isOwner = existingArticle.authorId === userId
    const canEditArticle = canEdit(userRole)
    
    if (!isOwner && !canEditArticle) {
      return NextResponse.json({ error: 'غير مصرح لك بتعديل هذا المقال' }, { status: 403 })
    }

    // لا يمكن تعديل المقالات المنشورة (فقط المسودات) إلا المحررين فما فوق
    if (existingArticle.status === 'APPROVED' && !canEditArticle) {
      return NextResponse.json({ error: 'لا يمكن تعديل مقال منشور' }, { status: 400 })
    }

    // بناء بيانات التحديث
    const updateData: Record<string, unknown> = {}
    if (validatedData.title) {
      updateData.title = validatedData.title
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

/**
 * Articles API - SECURED & OPTIMIZED
 * 
 * Security Fixes Applied:
 * 1. authorId is taken from session, NOT from request body
 * 2. User must be authenticated to create/update articles
 * 3. Only article owner or admin can update articles
 * 4. Rate limiting prevents content spam
 * 
 * Performance Fixes Applied:
 * 1. N+1 queries fixed with batch operations using $transaction
 * 2. Tag operations use bulk upserts instead of sequential loops
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { getAuthUser, canEdit } from '@/lib/session'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limiter'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

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
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// ============================================
// POST Create Article (Authenticated)
// ============================================

export async function POST(request: NextRequest) {
  try {
    // RATE LIMIT: Prevent content spam (10 articles per hour per IP)
    const clientIP = getClientIP(request)
    const rateLimit = checkRateLimit(`article:${clientIP}`, RATE_LIMITS.ARTICLE_CREATE)
    
    if (!rateLimit.allowed) {
      const resetMinutes = Math.ceil((rateLimit.resetAt - Date.now()) / 60000)
      return NextResponse.json({ 
        error: `تم تجاوز حد إنشاء المقالات. يرجى المحاولة بعد ${resetMinutes} دقيقة` 
      }, { status: 429 })
    }

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

    // Get default category if not provided
    let categoryId = validatedData.categoryId
    if (!categoryId) {
      const defaultCategory = await db.category.findFirst()
      categoryId = defaultCategory?.id
    }

    if (!categoryId) {
      return NextResponse.json({ error: 'لا يوجد قسم افتراضي' }, { status: 400 })
    }

    // Parse tags once
    const tagNames = validatedData.tags 
      ? validatedData.tags.split(',').map(t => t.trim()).filter(Boolean)
      : []

    // PERFORMANCE: Use transaction for batch operations
    const result = await db.$transaction(async (tx) => {
      // Create article
      const article = await tx.article.create({
        data: {
          title: validatedData.title || 'مسودة بدون عنوان',
          slug: uniqueSlug,
          excerpt: validatedData.excerpt || '',
          content: validatedData.content || {},
          authorId: userId,
          categoryId,
          governorateId: validatedData.governorateId || null,
          status: validatedData.status,
          primaryLang: 'ar',
          featuredImage: validatedData.featuredImage || null,
          featuredImageAlt: validatedData.featuredImageAlt || null,
          metaTitle: validatedData.metaTitle || null,
          metaDescription: validatedData.metaDescription || null,
          keywords: validatedData.keywords || null
        }
      })

      // PERFORMANCE: Batch tag operations
      if (tagNames.length > 0) {
        // Upsert all tags in parallel
        const tagOperations = tagNames.map(tagName => {
          const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-')
          return tx.tag.upsert({
            where: { slug: tagSlug },
            create: { name: tagName, slug: tagSlug, articleCount: 1 },
            update: { articleCount: { increment: 1 } }
          })
        })
        
        const tags = await Promise.all(tagOperations)
        
        // Create article-tag relations in batch
        await tx.articleTag.createMany({
          data: tags.map(tag => ({ articleId: article.id, tagId: tag.id })),
          skipDuplicates: true
        })
      }

      // Update category article count
      await tx.category.update({
        where: { id: categoryId },
        data: { articleCount: { increment: 1 } }
      })

      // Award points for article submission
      await tx.user.update({
        where: { id: userId },
        data: { points: { increment: 10 } }
      })

      return article
    })

    return NextResponse.json({
      success: true,
      message: validatedData.status === 'PENDING' 
        ? 'تم إرسال المقال للمراجعة' 
        : 'تم حفظ المسودة',
      article: result
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

    // Parse tags if provided
    const newTagNames = validatedData.tags !== undefined 
      ? validatedData.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : null

    // PERFORMANCE: Use transaction for batch operations
    const result = await db.$transaction(async (tx) => {
      // Update article
      const updatedArticle = await tx.article.update({
        where: { id: validatedData.articleId },
        data: updateData
      })

      // تحديث الوسوم إذا تم توفيرها
      if (newTagNames !== null) {
        // Get current tags
        const oldTags = await tx.articleTag.findMany({
          where: { articleId: validatedData.articleId },
          select: { tagId: true }
        })

        // PERFORMANCE: Batch decrement old tags
        if (oldTags.length > 0) {
          await tx.tag.updateMany({
            where: { id: { in: oldTags.map(t => t.tagId) } },
            data: { articleCount: { decrement: 1 } }
          })
        }
        
        // Delete old article-tag relations
        await tx.articleTag.deleteMany({
          where: { articleId: validatedData.articleId }
        })

        // PERFORMANCE: Batch upsert new tags
        if (newTagNames.length > 0) {
          const tagOperations = newTagNames.map(tagName => {
            const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-')
            return tx.tag.upsert({
              where: { slug: tagSlug },
              create: { name: tagName, slug: tagSlug, articleCount: 1 },
              update: { articleCount: { increment: 1 } }
            })
          })
          
          const tags = await Promise.all(tagOperations)
          
          // Create article-tag relations in batch
          await tx.articleTag.createMany({
            data: tags.map(tag => ({ articleId: validatedData.articleId, tagId: tag.id })),
            skipDuplicates: true
          })
        }
      }

      return updatedArticle
    })

    return NextResponse.json({
      success: true,
      message: validatedData.status === 'PENDING' 
        ? 'تم إرسال المقال للمراجعة' 
        : 'تم حفظ المسودة',
      article: result
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

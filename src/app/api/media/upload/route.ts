/**
 * Media Upload API
 * 
 * SECURITY: Requires authentication for all uploads
 * 
 * Unified endpoint for all media uploads:
 * - POST /api/media/upload/image - Article images
 * - POST /api/media/upload/avatar - User avatars
 * - POST /api/media/upload/video - Videos (Bunny Stream)
 * - POST /api/media/upload/audio - Audio files
 * - POST /api/media/upload/document - PDFs
 */

import { NextRequest, NextResponse } from 'next/server'
import { mediaService } from '@/services/media.service'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'

// ============================================
// Image Upload
// ============================================

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require authentication for all uploads
    const auth = await getAuthUser(request)
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: 'يجب تسجيل الدخول لرفع الملفات' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // image, avatar, video, audio, document
    const slug = formData.get('slug') as string || 'upload'
    const altText = formData.get('altText') as string || ''
    const articleId = formData.get('articleId') as string | null
    const userId = formData.get('userId') as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'لم يتم اختيار ملف' },
        { status: 400 }
      )
    }

    // SECURITY: For avatar uploads, only allow users to upload their own avatar
    // Or admins can upload for anyone
    if (type === 'avatar' && userId) {
      const isOwnAvatar = userId === auth.user.id
      const isAdminUser = auth.user.role === 'ADMIN'
      if (!isOwnAvatar && !isAdminUser) {
        return NextResponse.json(
          { success: false, error: 'غير مصرح لك برفع صورة لهذا المستخدم' },
          { status: 403 }
        )
      }
    }

    let result

    switch (type) {
      case 'image':
        result = await mediaService.uploadArticleImage(file, slug, altText)
        
        // Save to database if articleId provided
        if (result.success && articleId) {
          await db.articleMedia.create({
            data: {
              id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              articleId,
              type: 'IMAGE',
              url: result.url,
              publicId: result.publicId,
              altText,
              width: result.width,
              height: result.height,
              size: result.size,
              mimeType: result.mimeType,
            }
          })
        }
        break

      case 'avatar':
        // Use authenticated user's ID if not provided
        const targetUserId = userId || auth.user.id
        
        // Get old avatar publicId for cleanup
        const user = await db.user.findUnique({
          where: { id: targetUserId },
          select: { image: true }
        })
        
        const oldAvatarId = user?.image?.includes(process.env.R2_PUBLIC_URL || '')
          ? user.image.replace(`${process.env.R2_PUBLIC_URL}/`, '')
          : undefined
        
        result = await mediaService.uploadAvatar(file, targetUserId, oldAvatarId)
        
        // Update user in database
        if (result.success) {
          await db.user.update({
            where: { id: targetUserId },
            data: { image: result.url }
          })
        }
        break

      case 'video':
        result = await mediaService.uploadVideo(file, slug)
        
        // Save to database if articleId provided
        if (result.success && articleId) {
          await db.articleMedia.create({
            data: {
              id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              articleId,
              type: 'VIDEO',
              url: result.url,
              publicId: result.publicId,
              videoId: result.videoId,
              embedUrl: result.embedUrl,
              thumbnail: result.thumbnail,
              size: result.size,
              mimeType: result.mimeType,
            }
          })
        }
        break

      case 'audio':
        result = await mediaService.uploadAudio(file, slug)
        
        // Save to database if articleId provided
        if (result.success && articleId) {
          await db.articleMedia.create({
            data: {
              id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              articleId,
              type: 'AUDIO',
              url: result.url,
              publicId: result.publicId,
              size: result.size,
              mimeType: result.mimeType,
            }
          })
        }
        break

      case 'document':
        result = await mediaService.uploadDocument(file, slug)
        
        // Save to database if articleId provided
        if (result.success && articleId) {
          await db.articleMedia.create({
            data: {
              id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              articleId,
              type: 'DOCUMENT',
              url: result.url,
              publicId: result.publicId,
              size: result.size,
              mimeType: result.mimeType,
            }
          })
        }
        break

      default:
        return NextResponse.json(
          { success: false, error: 'نوع الرفع غير صالح' },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}

// ============================================
// Delete Media
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    // SECURITY: Require authentication
    const auth = await getAuthUser(request)
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: 'يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get('mediaId')

    if (!mediaId) {
      return NextResponse.json(
        { success: false, error: 'معرف الملف مطلوب' },
        { status: 400 }
      )
    }

    const success = await mediaService.deleteMedia(mediaId)

    return NextResponse.json({ success })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}

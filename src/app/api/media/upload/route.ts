/**
 * Media Upload API
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

// ============================================
// Image Upload
// ============================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // image, avatar, video, audio, document
    const slug = formData.get('slug') as string || 'upload'
    const altText = formData.get('altText') as string || ''
    const articleId = formData.get('articleId') as string | null
    const userId = formData.get('userId') as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    let result

    switch (type) {
      case 'image':
        result = await mediaService.uploadArticleImage(file, slug, altText)
        
        // Save to database if articleId provided
        if (result.success && articleId) {
          await db.articleMedia.create({
            data: {
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
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'userId required for avatar upload' },
            { status: 400 }
          )
        }
        
        // Get old avatar publicId for cleanup
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { image: true }
        })
        
        const oldAvatarId = user?.image?.includes(process.env.R2_PUBLIC_URL || '')
          ? user.image.replace(`${process.env.R2_PUBLIC_URL}/`, '')
          : undefined
        
        result = await mediaService.uploadAvatar(file, userId, oldAvatarId)
        
        // Update user in database
        if (result.success) {
          await db.user.update({
            where: { id: userId },
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
          { success: false, error: 'Invalid upload type' },
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
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================
// Delete Media
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get('mediaId')

    if (!mediaId) {
      return NextResponse.json(
        { success: false, error: 'mediaId required' },
        { status: 400 }
      )
    }

    const success = await mediaService.deleteMedia(mediaId)

    return NextResponse.json({ success })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

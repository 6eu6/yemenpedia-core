/**
 * MediaService - Centralized Media Processing & Storage
 * 
 * SINGLETON SERVICE for all media operations:
 * - Image processing with Sharp (WebP conversion, resizing, metadata stripping)
 * - Cloudflare R2 for images, audio, PDFs
 * - Bunny Stream for videos
 * - Automatic cleanup of old files
 * 
 * @example
 * const mediaService = MediaService.getInstance()
 * const result = await mediaService.uploadArticleImage(file, 'article-slug')
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import sharp from 'sharp'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'

// ============================================
// Types & Interfaces
// ============================================

export type MediaType = 'image' | 'video' | 'audio' | 'document'
export type ImageContext = 'article' | 'avatar' | 'cover' | 'gallery' | 'citation'

export interface UploadResult {
  success: boolean
  url: string
  publicId: string
  thumbnail?: string
  width?: number
  height?: number
  size: number
  mimeType: string
  error?: string
}

export interface VideoUploadResult extends UploadResult {
  videoId: string
  embedUrl: string
  duration?: number
}

export interface ProcessingOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
  square?: boolean
}

// ============================================
// Configuration
// ============================================

interface MediaConfig {
  r2: {
    accountId: string
    accessKeyId: string
    secretAccessKey: string
    bucketName: string
    endpoint: string
    publicUrl: string
  }
  bunny: {
    libraryId: string
    apiKey: string
    cdnHostname: string
  }
  processing: {
    articleImageMaxWidth: number
    avatarSize: number
    thumbnailSize: number
    quality: number
  }
  limits: {
    maxImageSize: number
    maxVideoSize: number
    maxAudioSize: number
    maxDocumentSize: number
  }
}

function getMediaConfig(): MediaConfig {
  return {
    r2: {
      accountId: process.env.R2_ACCOUNT_ID!,
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      bucketName: process.env.R2_BUCKET_NAME || 'yemenpedia-media',
      endpoint: process.env.R2_ENDPOINT!,
      publicUrl: process.env.R2_PUBLIC_URL!,
    },
    bunny: {
      libraryId: process.env.BUNNY_LIBRARY_ID!,
      apiKey: process.env.BUNNY_API_KEY!,
      cdnHostname: process.env.BUNNY_CDN_HOSTNAME!,
    },
    processing: {
      articleImageMaxWidth: parseInt(process.env.IMAGE_MAX_WIDTH || '1200'),
      avatarSize: parseInt(process.env.AVATAR_SIZE || '400'),
      thumbnailSize: parseInt(process.env.THUMBNAIL_SIZE || '300'),
      quality: parseInt(process.env.IMAGE_QUALITY || '85'),
    },
    limits: {
      maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE || '10485760'),      // 10MB
      maxVideoSize: parseInt(process.env.MAX_VIDEO_SIZE || '524288000'),     // 500MB
      maxAudioSize: parseInt(process.env.MAX_AUDIO_SIZE || '52428800'),      // 50MB
      maxDocumentSize: parseInt(process.env.MAX_PDF_SIZE || '20971520'),     // 20MB
    },
  }
}

// ============================================
// MediaService Singleton
// ============================================

export class MediaService {
  private static instance: MediaService
  private config: MediaConfig
  private r2Client: S3Client

  private constructor() {
    this.config = getMediaConfig()
    this.r2Client = new S3Client({
      region: 'auto',
      endpoint: this.config.r2.endpoint,
      credentials: {
        accessKeyId: this.config.r2.accessKeyId,
        secretAccessKey: this.config.r2.secretAccessKey,
      },
    })
  }

  public static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService()
    }
    return MediaService.instance
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Generate SEO-friendly filename
   * Format: [context]-[slug]-[timestamp]-[hash].webp
   */
  private generateFilename(context: string, slug: string, extension: string = 'webp'): string {
    const timestamp = Date.now()
    const hash = randomBytes(4).toString('hex')
    const sanitizedSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF-]/g, '-') // Keep Arabic chars
      .replace(/-+/g, '-')
      .substring(0, 50)
    
    return `${context}-${sanitizedSlug}-${timestamp}-${hash}.${extension}`
  }

  /**
   * Get folder path based on media type and context
   */
  private getFolderPath(type: MediaType, context?: string): string {
    const folders: Record<MediaType, string> = {
      image: 'images',
      video: 'videos',
      audio: 'audio',
      document: 'documents',
    }
    
    const baseFolder = folders[type]
    if (context && context !== 'article') {
      return `${baseFolder}/${context}`
    }
    return baseFolder
  }

  /**
   * Validate file size
   */
  private validateSize(size: number, type: MediaType): { valid: boolean; error?: string } {
    const limits = this.config.limits
    const maxSize = {
      image: limits.maxImageSize,
      video: limits.maxVideoSize,
      audio: limits.maxAudioSize,
      document: limits.maxDocumentSize,
    }

    if (size > maxSize[type]) {
      const maxMB = Math.round(maxSize[type] / (1024 * 1024))
      return { valid: false, error: `File size exceeds ${maxMB}MB limit` }
    }
    return { valid: true }
  }

  // ============================================
  // Image Processing with Sharp
  // ============================================

  /**
   * Process image with Sharp
   * - Convert to WebP
   * - Resize
   * - Strip metadata
   */
  private async processImage(
    buffer: Buffer,
    options: ProcessingOptions = {}
  ): Promise<{ buffer: Buffer; width: number; height: number }> {
    const {
      maxWidth = this.config.processing.articleImageMaxWidth,
      maxHeight,
      quality = this.config.processing.quality,
      square = false,
    } = options

    let image = sharp(buffer)
    
    // Strip ALL metadata (EXIF, GPS, etc.)
    image = image.rotate() // Auto-rotate based on EXIF
    // Note: webp output will strip metadata by default

    // Get dimensions
    const metadata = await image.metadata()
    let width = metadata.width || maxWidth
    let height = metadata.height || maxWidth

    // Calculate resize dimensions
    if (square) {
      // Square crop (for avatars)
      const size = this.config.processing.avatarSize
      image = image.resize(size, size, { 
        fit: 'cover',
        position: 'center'
      })
      width = size
      height = size
    } else {
      // Maintain aspect ratio
      const resizeOptions: sharp.ResizeOptions = {
        fit: 'inside',
        withoutEnlargement: true,
      }
      
      if (maxWidth && width > maxWidth) {
        resizeOptions.width = maxWidth
      }
      if (maxHeight && height > maxHeight) {
        resizeOptions.height = maxHeight
      }
      
      image = image.resize(resizeOptions)
      
      // Update dimensions after resize
      if (resizeOptions.width || resizeOptions.height) {
        const resizedMeta = await sharp(await image.toBuffer()).metadata()
        width = resizedMeta.width || width
        height = resizedMeta.height || height
      }
    }

    // Convert to WebP
    image = image.webp({ 
      quality,
      effort: 4, // Balance between speed and compression
    })

    const processedBuffer = await image.toBuffer()
    
    return {
      buffer: processedBuffer,
      width,
      height,
    }
  }

  /**
   * Create thumbnail for images
   */
  private async createThumbnail(buffer: Buffer, size: number = 300): Promise<Buffer> {
    return sharp(buffer)
      .resize(size, size, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 70 })
      .toBuffer()
  }

  // ============================================
  // R2 Upload Methods
  // ============================================

  /**
   * Upload file to Cloudflare R2
   */
  private async uploadToR2(
    buffer: Buffer,
    key: string,
    mimeType: string
  ): Promise<{ url: string; publicId: string }> {
    await this.r2Client.send(
      new PutObjectCommand({
        Bucket: this.config.r2.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000, immutable', // 1 year cache
      })
    )

    return {
      url: `${this.config.r2.publicUrl}/${key}`,
      publicId: key,
    }
  }

  /**
   * Delete file from Cloudflare R2
   */
  public async deleteFromR2(publicId: string): Promise<boolean> {
    try {
      await this.r2Client.send(
        new DeleteObjectCommand({
          Bucket: this.config.r2.bucketName,
          Key: publicId,
        })
      )
      return true
    } catch {
      return false
    }
  }

  // ============================================
  // Bunny Stream Upload Methods
  // ============================================

  /**
   * Upload video to Bunny Stream
   */
  private async uploadToBunny(
    buffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<VideoUploadResult> {
    const { libraryId, apiKey, cdnHostname } = this.config.bunny

    try {
      // Create video entry
      const createResponse = await fetch(
        `https://video.bunnycdn.com/library/${libraryId}/videos`,
        {
          method: 'POST',
          headers: {
            AccessKey: apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: filename }),
        }
      )

      if (!createResponse.ok) {
        throw new Error('Failed to create video entry')
      }

      const { guid } = await createResponse.json()

      // Upload video file
      const uploadResponse = await fetch(
        `https://video.bunnycdn.com/library/${libraryId}/videos/${guid}`,
        {
          method: 'PUT',
          headers: {
            AccessKey: apiKey,
            'Content-Type': mimeType,
          },
          body: new Uint8Array(buffer),
        }
      )

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video file')
      }

      return {
        success: true,
        url: `https://${cdnHostname}/${guid}/playlist.m3u8`,
        publicId: guid,
        videoId: guid,
        embedUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${guid}`,
        thumbnail: `https://${cdnHostname}/${guid}/thumbnail.jpg`,
        size: buffer.length,
        mimeType,
      }
    } catch (error) {
      return {
        success: false,
        url: '',
        publicId: '',
        videoId: '',
        embedUrl: '',
        size: 0,
        mimeType,
        error: error instanceof Error ? error.message : 'Video upload failed',
      }
    }
  }

  // ============================================
  // Public Upload Methods
  // ============================================

  /**
   * Upload article image
   * - Converts to WebP
   * - Resizes to max 1200px
   * - Strips metadata
   */
  public async uploadArticleImage(
    file: File | Buffer,
    slug: string,
    altText: string,
    options?: ProcessingOptions
  ): Promise<UploadResult> {
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file
    const mimeType = file instanceof File ? file.type : 'image/jpeg'
    const originalSize = buffer.length

    // Validate size
    const sizeCheck = this.validateSize(originalSize, 'image')
    if (!sizeCheck.valid) {
      return { success: false, url: '', publicId: '', size: 0, mimeType, error: sizeCheck.error }
    }

    try {
      // Process image
      const { buffer: processedBuffer, width, height } = await this.processImage(buffer, options)
      
      // Generate filename
      const filename = this.generateFilename('article', slug)
      const folderPath = this.getFolderPath('image', 'articles')
      const key = `${folderPath}/${filename}`

      // Upload to R2
      const { url, publicId } = await this.uploadToR2(processedBuffer, key, 'image/webp')

      return {
        success: true,
        url,
        publicId,
        width,
        height,
        size: processedBuffer.length,
        mimeType: 'image/webp',
      }
    } catch (error) {
      return {
        success: false,
        url: '',
        publicId: '',
        size: 0,
        mimeType,
        error: error instanceof Error ? error.message : 'Image upload failed',
      }
    }
  }

  /**
   * Upload user avatar
   * - Converts to WebP
   * - Resizes to 400x400 (square)
   * - Strips metadata
   * - Deletes old avatar
   */
  public async uploadAvatar(
    file: File | Buffer,
    userId: string,
    oldAvatarId?: string
  ): Promise<UploadResult> {
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file
    const mimeType = file instanceof File ? file.type : 'image/jpeg'

    // Validate size
    const sizeCheck = this.validateSize(buffer.length, 'image')
    if (!sizeCheck.valid) {
      return { success: false, url: '', publicId: '', size: 0, mimeType, error: sizeCheck.error }
    }

    try {
      // Process image (square crop)
      const { buffer: processedBuffer, width, height } = await this.processImage(buffer, {
        square: true,
        maxWidth: this.config.processing.avatarSize,
        maxHeight: this.config.processing.avatarSize,
      })

      // Generate filename
      const filename = this.generateFilename('avatar', userId)
      const folderPath = this.getFolderPath('image', 'profiles')
      const key = `${folderPath}/${filename}`

      // Upload to R2
      const { url, publicId } = await this.uploadToR2(processedBuffer, key, 'image/webp')

      // Delete old avatar if exists
      if (oldAvatarId) {
        await this.deleteFromR2(oldAvatarId)
      }

      return {
        success: true,
        url,
        publicId,
        width,
        height,
        size: processedBuffer.length,
        mimeType: 'image/webp',
      }
    } catch (error) {
      return {
        success: false,
        url: '',
        publicId: '',
        size: 0,
        mimeType,
        error: error instanceof Error ? error.message : 'Avatar upload failed',
      }
    }
  }

  /**
   * Upload video to Bunny Stream
   */
  public async uploadVideo(
    file: File | Buffer,
    slug: string
  ): Promise<VideoUploadResult> {
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file
    const mimeType = file instanceof File ? file.type : 'video/mp4'

    // Validate size
    const sizeCheck = this.validateSize(buffer.length, 'video')
    if (!sizeCheck.valid) {
      return {
        success: false,
        url: '',
        publicId: '',
        videoId: '',
        embedUrl: '',
        size: 0,
        mimeType,
        error: sizeCheck.error,
      }
    }

    // Generate filename
    const filename = this.generateFilename('video', slug, 'mp4')

    return this.uploadToBunny(buffer, filename, mimeType)
  }

  /**
   * Upload audio file to R2
   */
  public async uploadAudio(
    file: File | Buffer,
    slug: string,
    title?: string
  ): Promise<UploadResult> {
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file
    const mimeType = file instanceof File ? file.type : 'audio/mpeg'

    // Validate size
    const sizeCheck = this.validateSize(buffer.length, 'audio')
    if (!sizeCheck.valid) {
      return { success: false, url: '', publicId: '', size: 0, mimeType, error: sizeCheck.error }
    }

    try {
      // Generate filename
      const ext = mimeType.includes('mpeg') ? 'mp3' : mimeType.includes('wav') ? 'wav' : 'ogg'
      const filename = this.generateFilename('audio', slug, ext)
      const folderPath = this.getFolderPath('audio')
      const key = `${folderPath}/${filename}`

      // Upload to R2
      const { url, publicId } = await this.uploadToR2(buffer, key, mimeType)

      return {
        success: true,
        url,
        publicId,
        size: buffer.length,
        mimeType,
      }
    } catch (error) {
      return {
        success: false,
        url: '',
        publicId: '',
        size: 0,
        mimeType,
        error: error instanceof Error ? error.message : 'Audio upload failed',
      }
    }
  }

  /**
   * Upload document (PDF) to R2
   */
  public async uploadDocument(
    file: File | Buffer,
    slug: string,
    title?: string
  ): Promise<UploadResult> {
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file
    const mimeType = file instanceof File ? file.type : 'application/pdf'

    // Validate size
    const sizeCheck = this.validateSize(buffer.length, 'document')
    if (!sizeCheck.valid) {
      return { success: false, url: '', publicId: '', size: 0, mimeType, error: sizeCheck.error }
    }

    try {
      // Generate filename
      const filename = this.generateFilename('doc', slug, 'pdf')
      const folderPath = this.getFolderPath('document')
      const key = `${folderPath}/${filename}`

      // Upload to R2
      const { url, publicId } = await this.uploadToR2(buffer, key, mimeType)

      return {
        success: true,
        url,
        publicId,
        size: buffer.length,
        mimeType,
      }
    } catch (error) {
      return {
        success: false,
        url: '',
        publicId: '',
        size: 0,
        mimeType,
        error: error instanceof Error ? error.message : 'Document upload failed',
      }
    }
  }

  // ============================================
  // Cleanup Methods
  // ============================================

  /**
   * Delete media and its database record
   */
  public async deleteMedia(mediaId: string): Promise<boolean> {
    try {
      // Get media record
      const media = await db.articleMedia.findUnique({
        where: { id: mediaId },
      })

      if (!media) return false

      // Delete from R2 or Bunny
      if (media.type === 'VIDEO' && media.videoId) {
        // Delete from Bunny Stream
        await fetch(
          `https://video.bunnycdn.com/library/${this.config.bunny.libraryId}/videos/${media.videoId}`,
          {
            method: 'DELETE',
            headers: { AccessKey: this.config.bunny.apiKey },
          }
        )
      } else if (media.publicId) {
        // Delete from R2
        await this.deleteFromR2(media.publicId)
      }

      // Delete database record
      await db.articleMedia.delete({ where: { id: mediaId } })

      return true
    } catch {
      return false
    }
  }

  /**
   * Cleanup old avatar when user updates profile
   */
  public async cleanupOldAvatar(userId: string): Promise<void> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { image: true },
    })

    if (user?.image?.includes(this.config.r2.publicUrl)) {
      // Extract publicId from URL
      const publicId = user.image.replace(`${this.config.r2.publicUrl}/`, '')
      await this.deleteFromR2(publicId)
    }
  }
}

// Export singleton instance
export const mediaService = MediaService.getInstance()

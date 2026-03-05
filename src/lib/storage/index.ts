/**
 * Storage Service - CLOUD ONLY (R2 + Bunny Stream)
 * 
 * GOVERNANCE COMPLIANCE:
 * - Article I, Section 1.2: Local Storage STRICTLY BANNED
 * - All uploads go to Cloudflare R2 (images/docs) or Bunny Stream (videos)
 * - NO local filesystem writes
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getStorageConfig, validateStorageConfig, StorageProvider } from './config'
import sharp from 'sharp'
import { randomBytes } from 'crypto'

// ============================================
// Types & Interfaces
// ============================================

export interface UploadResult {
  success: boolean
  url: string
  publicId: string
  provider: StorageProvider
  width?: number
  height?: number
  size: number
  mimeType: string
  error?: string
}

export interface VideoUploadResult extends UploadResult {
  videoId?: string
  embedUrl?: string
  thumbnail?: string
  duration?: number
}

export interface FileUpload {
  file: File | Buffer
  filename: string
  mimeType: string
  folder?: string
}

// ============================================
// R2 Client Initialization
// ============================================

let r2Client: S3Client | null = null

function getR2Client(): S3Client {
  if (!r2Client) {
    const config = getStorageConfig()
    r2Client = new S3Client({
      region: 'auto',
      endpoint: config.r2.endpoint,
      credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretAccessKey,
      },
    })
  }
  return r2Client
}

// ============================================
// Utility Functions
// ============================================

/**
 * Generate unique filename
 */
function generateUniqueFilename(originalName: string, extension?: string): string {
  const timestamp = Date.now()
  const randomString = randomBytes(4).toString('hex')
  const ext = extension || originalName.split('.').pop() || 'bin'
  const baseName = originalName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .substring(0, 50)
  
  return `${timestamp}-${randomString}-${baseName}.${ext}`
}

/**
 * Validate file size
 */
function validateFileSize(size: number, maxSizeMB: number): { valid: boolean; error?: string } {
  const maxBytes = maxSizeMB * 1024 * 1024
  if (size > maxBytes) {
    return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` }
  }
  return { valid: true }
}

// ============================================
// Image Processing with Sharp (Article I, Section 1.3)
// ============================================

/**
 * Process image with Sharp:
 * 1. Convert to WebP
 * 2. Quality: 80%
 * 3. Strip ALL EXIF/GPS data
 * 4. Resize according to context
 */
async function processImage(
  buffer: Buffer,
  options: { maxWidth?: number; maxHeight?: number; square?: boolean } = {}
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const { maxWidth = 1200, maxHeight, square = false } = options
  
  let image = sharp(buffer)
  
  // Auto-rotate based on EXIF, then strip all metadata
  // Note: webp output will strip metadata by default
  image = image.rotate()
  
  // Get original dimensions
  const metadata = await image.metadata()
  let width = metadata.width || maxWidth
  let height = metadata.height || maxWidth
  
  if (square) {
    // Square crop (avatars)
    const size = 400
    image = image.resize(size, size, { fit: 'cover', position: 'center' })
    width = size
    height = size
  } else if (maxWidth || maxHeight) {
    // Maintain aspect ratio
    const resizeOptions: sharp.ResizeOptions = { fit: 'inside', withoutEnlargement: true }
    if (width > maxWidth) resizeOptions.width = maxWidth
    if (maxHeight && height > maxHeight) resizeOptions.height = maxHeight
    image = image.resize(resizeOptions)
    
    // Get new dimensions
    const newMeta = await sharp(await image.toBuffer()).metadata()
    width = newMeta.width || width
    height = newMeta.height || height
  }
  
  // Convert to WebP at 80% quality (GOVERNANCE: Article I, Section 1.3)
  image = image.webp({ quality: 80, effort: 4 })
  
  const processedBuffer = await image.toBuffer()
  
  return { buffer: processedBuffer, width, height }
}

// ============================================
// R2 Upload (Images & Documents)
// ============================================

async function uploadToR2(
  buffer: Buffer,
  key: string,
  mimeType: string
): Promise<{ url: string; publicId: string }> {
  const config = getStorageConfig()
  const client = getR2Client()
  
  await client.send(
    new PutObjectCommand({
      Bucket: config.r2.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000, immutable', // 1 year cache
    })
  )
  
  return {
    url: `${config.r2.publicUrl}/${key}`,
    publicId: key,
  }
}

async function deleteFromR2(publicId: string): Promise<boolean> {
  try {
    const config = getStorageConfig()
    const client = getR2Client()
    
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.r2.bucketName,
        Key: publicId,
      })
    )
    return true
  } catch (error) {
    console.error('Failed to delete from R2:', error)
    return false
  }
}

// ============================================
// Bunny Stream Upload (Videos)
// ============================================

async function uploadToBunny(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<VideoUploadResult> {
  const config = getStorageConfig()
  
  try {
    // Create video entry
    const createResponse = await fetch(
      `https://video.bunnycdn.com/library/${config.bunny.libraryId}/videos`,
      {
        method: 'POST',
        headers: {
          AccessKey: config.bunny.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: filename }),
      }
    )
    
    if (!createResponse.ok) {
      throw new Error('Failed to create video entry in Bunny')
    }
    
    const { guid } = await createResponse.json()
    
    // Upload video file
    const uploadResponse = await fetch(
      `https://video.bunnycdn.com/library/${config.bunny.libraryId}/videos/${guid}`,
      {
        method: 'PUT',
        headers: {
          AccessKey: config.bunny.apiKey,
          'Content-Type': mimeType,
        },
        body: new Uint8Array(buffer),
      }
    )
    
    if (!uploadResponse.ok) {
      throw new Error('Failed to upload video to Bunny')
    }
    
    return {
      success: true,
      url: `https://${config.bunny.cdnHostname}/${guid}/playlist.m3u8`,
      publicId: guid,
      provider: 'bunny',
      videoId: guid,
      embedUrl: `https://iframe.mediadelivery.net/embed/${config.bunny.libraryId}/${guid}`,
      thumbnail: `https://${config.bunny.cdnHostname}/${guid}/thumbnail.jpg`,
      size: buffer.length,
      mimeType,
    }
  } catch (error) {
    return {
      success: false,
      url: '',
      publicId: '',
      provider: 'bunny',
      size: 0,
      mimeType,
      error: error instanceof Error ? error.message : 'Video upload failed',
    }
  }
}

async function deleteFromBunny(videoId: string): Promise<boolean> {
  try {
    const config = getStorageConfig()
    
    await fetch(
      `https://video.bunnycdn.com/library/${config.bunny.libraryId}/videos/${videoId}`,
      {
        method: 'DELETE',
        headers: { AccessKey: config.bunny.apiKey },
      }
    )
    return true
  } catch (error) {
    console.error('Failed to delete from Bunny:', error)
    return false
  }
}

// ============================================
// Main Upload Function - CLOUD ONLY
// ============================================

export async function uploadFile(upload: FileUpload): Promise<UploadResult | VideoUploadResult> {
  // Validate storage configuration
  const validation = validateStorageConfig()
  if (!validation.valid) {
    return {
      success: false,
      url: '',
      publicId: '',
      provider: 'r2',
      size: 0,
      mimeType: upload.mimeType,
      error: `Storage not configured. Missing: ${validation.missing.join(', ')}`,
    }
  }
  
  const buffer = upload.file instanceof File 
    ? Buffer.from(await upload.file.arrayBuffer()) 
    : upload.file
  
  const mimeType = upload.mimeType
  const isImage = mimeType.startsWith('image/')
  const isVideo = mimeType.startsWith('video/')
  const isDocument = mimeType.includes('pdf') || mimeType.includes('document')
  
  const folder = upload.folder || 'general'
  const filename = generateUniqueFilename(upload.filename)
  
  // Route to appropriate cloud provider
  if (isVideo) {
    // Validate video size (max 500MB)
    const sizeCheck = validateFileSize(buffer.length, 500)
    if (!sizeCheck.valid) {
      return {
        success: false,
        url: '',
        publicId: '',
        provider: 'bunny',
        size: buffer.length,
        mimeType,
        error: sizeCheck.error,
      }
    }
    
    return uploadToBunny(buffer, filename, mimeType)
  }
  
  if (isImage) {
    // Validate image size (max 10MB)
    const sizeCheck = validateFileSize(buffer.length, 10)
    if (!sizeCheck.valid) {
      return {
        success: false,
        url: '',
        publicId: '',
        provider: 'r2',
        size: buffer.length,
        mimeType,
        error: sizeCheck.error,
      }
    }
    
    // Process image with Sharp
    try {
      const { buffer: processedBuffer, width, height } = await processImage(buffer)
      const key = `images/${folder}/${filename.replace(/\.[^/.]+$/, '.webp')}`
      
      const { url, publicId } = await uploadToR2(processedBuffer, key, 'image/webp')
      
      return {
        success: true,
        url,
        publicId,
        provider: 'r2',
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
        provider: 'r2',
        size: 0,
        mimeType,
        error: error instanceof Error ? error.message : 'Image processing failed',
      }
    }
  }
  
  if (isDocument) {
    // Validate document size (max 20MB)
    const sizeCheck = validateFileSize(buffer.length, 20)
    if (!sizeCheck.valid) {
      return {
        success: false,
        url: '',
        publicId: '',
        provider: 'r2',
        size: buffer.length,
        mimeType,
        error: sizeCheck.error,
      }
    }
    
    const key = `documents/${folder}/${filename}`
    
    try {
      const { url, publicId } = await uploadToR2(buffer, key, mimeType)
      
      return {
        success: true,
        url,
        publicId,
        provider: 'r2',
        size: buffer.length,
        mimeType,
      }
    } catch (error) {
      return {
        success: false,
        url: '',
        publicId: '',
        provider: 'r2',
        size: 0,
        mimeType,
        error: error instanceof Error ? error.message : 'Document upload failed',
      }
    }
  }
  
  return {
    success: false,
    url: '',
    publicId: '',
    provider: 'r2',
    size: 0,
    mimeType,
    error: 'Unsupported file type. Only images, videos, and PDFs are allowed.',
  }
}

// ============================================
// Delete Function
// ============================================

export async function deleteFile(publicId: string, provider: StorageProvider): Promise<boolean> {
  if (provider === 'bunny') {
    return deleteFromBunny(publicId)
  }
  return deleteFromR2(publicId)
}

// ============================================
// Convenience Functions
// ============================================

export async function uploadImage(file: File | Buffer, filename: string, folder = 'general'): Promise<UploadResult> {
  return uploadFile({
    file,
    filename,
    mimeType: file instanceof File ? file.type : 'image/jpeg',
    folder,
  }) as Promise<UploadResult>
}

export async function uploadVideo(file: File | Buffer, filename: string, folder = 'general'): Promise<VideoUploadResult> {
  return uploadFile({
    file,
    filename,
    mimeType: file instanceof File ? file.type : 'video/mp4',
    folder,
  }) as Promise<VideoUploadResult>
}

export async function uploadDocument(file: File | Buffer, filename: string, folder = 'general'): Promise<UploadResult> {
  return uploadFile({
    file,
    filename,
    mimeType: file instanceof File ? file.type : 'application/pdf',
    folder,
  }) as Promise<UploadResult>
}

// Re-export config
export { getStorageConfig, validateStorageConfig } from './config'
export type { StorageConfig } from './config'

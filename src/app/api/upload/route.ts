/**
 * File Upload API
 * 
 * SECURITY: Requires authentication for all uploads
 * Rate limited to prevent storage abuse
 */
import { NextRequest, NextResponse } from 'next/server'
import { uploadFile, validateStorageConfig } from '@/lib/storage'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limiter'
import { getAuthUser } from '@/lib/session'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500MB

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require authentication
    const auth = await getAuthUser(request)
    if (!auth.success) {
      return NextResponse.json({ 
        error: 'يجب تسجيل الدخول لرفع الملفات' 
      }, { status: 401 })
    }

    // RATE LIMIT: Prevent storage abuse (20 uploads per hour per IP)
    const clientIP = getClientIP(request)
    const rateLimit = checkRateLimit(`upload:${clientIP}`, RATE_LIMITS.FILE_UPLOAD)
    
    if (!rateLimit.allowed) {
      const resetMinutes = Math.ceil((rateLimit.resetAt - Date.now()) / 60000)
      return NextResponse.json({ 
        error: `تم تجاوز حد رفع الملفات. يرجى المحاولة بعد ${resetMinutes} دقيقة` 
      }, { status: 429 })
    }

    // Validate storage configuration
    const configValidation = validateStorageConfig()

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = formData.get('folder') as string || 'general'
    const type = formData.get('type') as string || 'auto' // 'image', 'video', 'auto'

    if (!file) {
      return NextResponse.json({ error: 'لم يتم اختيار ملف' }, { status: 400 })
    }

    // Validate file size
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

    if (type === 'image' && !isImage) {
      return NextResponse.json({ error: 'نوع الملف غير مسموح. الأنواع المسموحة: JPG, PNG, GIF, WebP' }, { status: 400 })
    }

    if (type === 'video' && !isVideo) {
      return NextResponse.json({ error: 'نوع الملف غير مسموح. الأنواع المسموحة: MP4, WebM, MOV' }, { status: 400 })
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'حجم الصورة كبير جداً. الحد الأقصى: 10MB' }, { status: 400 })
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json({ error: 'حجم الفيديو كبير جداً. الحد الأقصى: 500MB' }, { status: 400 })
    }

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'نوع الملف غير مدعوم' }, { status: 400 })
    }

    // Upload the file
    const result = await uploadFile({
      file,
      filename: file.name,
      mimeType: file.type,
      folder
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'فشل رفع الملف' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
      provider: result.provider,
      file: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ أثناء رفع الملف' }, { status: 500 })
  }
}

// Get upload configuration status
export async function GET() {
  const configValidation = validateStorageConfig()
  
  return NextResponse.json({
    status: configValidation.valid ? 'configured' : 'partial',
    missing: configValidation.missing,
    message: configValidation.valid 
      ? 'جميع خدمات التخزين مُعدة بشكل صحيح'
      : 'بعض خدمات التخزين غير مُعدة. سيتم استخدام التخزين المحلي.'
  })
}

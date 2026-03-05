import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

// Image optimization configurations
const IMAGE_CONFIGS = {
  avatar: {
    width: 400,
    height: 400,
    quality: 85,
    fit: 'cover' as const,
  },
  cover: {
    width: 1500,
    height: 500,
    quality: 80,
    fit: 'cover' as const,
  },
  article: {
    width: 1200,
    height: 630,
    quality: 80,
    fit: 'cover' as const,
  },
  general: {
    width: 800,
    height: 800,
    quality: 80,
    fit: 'inside' as const,
  },
}

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const imageType = formData.get('imageType') as string || 'general' // avatar, cover, article, general
    const cropX = formData.get('cropX') ? parseFloat(formData.get('cropX') as string) : undefined
    const cropY = formData.get('cropY') ? parseFloat(formData.get('cropY') as string) : undefined
    const cropWidth = formData.get('cropWidth') ? parseFloat(formData.get('cropWidth') as string) : undefined
    const cropHeight = formData.get('cropHeight') ? parseFloat(formData.get('cropHeight') as string) : undefined

    if (!file) {
      return NextResponse.json({ error: 'لم يتم اختيار ملف' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'نوع الملف غير مسموح. الأنواع المسموحة: JPG, PNG, GIF, WebP' 
      }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'حجم الصورة كبير جداً. الحد الأقصى: 10MB' }, { status: 400 })
    }

    const config = IMAGE_CONFIGS[imageType as keyof typeof IMAGE_CONFIGS] || IMAGE_CONFIGS.general

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Get original metadata
    const metadata = await sharp(buffer).metadata()

    // Create sharp instance
    let sharpInstance = sharp(buffer)

    // Apply custom crop if provided, otherwise use center crop
    if (cropX !== undefined && cropY !== undefined && cropWidth && cropHeight) {
      sharpInstance = sharpInstance.extract({
        left: Math.round(cropX),
        top: Math.round(cropY),
        width: Math.round(cropWidth),
        height: Math.round(cropHeight),
      })
    } else {
      // Auto center crop
      const targetRatio = config.width / config.height
      const originalRatio = metadata.width! / metadata.height!
      
      let extractWidth = metadata.width!
      let extractHeight = metadata.height!
      let left = 0
      let top = 0

      if (originalRatio > targetRatio) {
        // Original is wider - crop sides
        extractWidth = Math.round(metadata.height! * targetRatio)
        left = Math.round((metadata.width! - extractWidth) / 2)
      } else {
        // Original is taller - crop top/bottom
        extractHeight = Math.round(metadata.width! / targetRatio)
        top = Math.round((metadata.height! - extractHeight) / 2)
      }

      sharpInstance = sharpInstance.extract({
        left,
        top,
        width: extractWidth,
        height: extractHeight,
      })
    }

    // Resize to target dimensions and convert to webp
    const processedBuffer = await sharpInstance
      .resize(config.width, config.height, { fit: config.fit })
      .webp({ quality: config.quality })
      .toBuffer()

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const filename = `${imageType}-${timestamp}-${randomStr}.webp`

    // Save to public folder
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', imageType)
    
    // Create directory if not exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const filePath = path.join(uploadDir, filename)
    fs.writeFileSync(filePath, processedBuffer)

    const url = `/uploads/${imageType}/${filename}`

    return NextResponse.json({
      success: true,
      url,
      filename,
      original: {
        width: metadata.width,
        height: metadata.height,
        size: Math.round(file.size / 1024),
        format: metadata.format,
      },
      processed: {
        width: config.width,
        height: config.height,
        size: Math.round(processedBuffer.length / 1024),
        format: 'webp',
      },
      savedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Image optimization error:', error)
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء معالجة الصورة',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Preview endpoint - returns preview image as base64
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')
    const imageType = searchParams.get('type') || 'general'

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 })
    }

    const config = IMAGE_CONFIGS[imageType as keyof typeof IMAGE_CONFIGS] || IMAGE_CONFIGS.general

    // Fetch image
    const response = await fetch(imageUrl)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Get metadata
    const metadata = await sharp(buffer).metadata()

    // Create preview
    const previewBuffer = await sharp(buffer)
      .resize(300, null, { fit: 'inside' })
      .webp({ quality: 70 })
      .toBuffer()

    const previewBase64 = previewBuffer.toString('base64')
    const previewUrl = `data:image/webp;base64,${previewBase64}`

    return NextResponse.json({
      success: true,
      preview: previewUrl,
      original: {
        width: metadata.width,
        height: metadata.height,
      },
      target: {
        width: config.width,
        height: config.height,
      },
      suggestedCrop: calculateCenterCrop(
        metadata.width || 0,
        metadata.height || 0,
        config.width,
        config.height
      ),
    })
  } catch (error) {
    console.error('Preview error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء المعاينة' }, { status: 500 })
  }
}

function calculateCenterCrop(
  originalWidth: number,
  originalHeight: number,
  targetWidth: number,
  targetHeight: number
) {
  const targetRatio = targetWidth / targetHeight
  const originalRatio = originalWidth / originalHeight

  let cropWidth, cropHeight, cropX, cropY

  if (originalRatio > targetRatio) {
    cropHeight = originalHeight
    cropWidth = Math.round(originalHeight * targetRatio)
    cropX = Math.round((originalWidth - cropWidth) / 2)
    cropY = 0
  } else {
    cropWidth = originalWidth
    cropHeight = Math.round(originalWidth / targetRatio)
    cropX = 0
    cropY = Math.round((originalHeight - cropHeight) / 2)
  }

  return { x: cropX, y: cropY, width: cropWidth, height: cropHeight }
}

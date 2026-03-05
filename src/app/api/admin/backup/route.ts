/**
 * Backup Utility for R2 Media - SECURED
 * 
 * Security Measures:
 * 1. Requires ADMIN_BACKUP_KEY from environment (no fallback)
 * 2. OR authenticated as admin user
 * 
 * GET /api/admin/backup/media - List all media
 * POST /api/admin/backup/media - Start backup
 */

import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { getAuthUser, isAdmin } from '@/lib/session'

const getR2Client = () => {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

/**
 * Verify authorization - either via API key or session
 */
async function verifyAuth(request: NextRequest): Promise<{ authorized: boolean; error?: string }> {
  // Option 1: Check for API key (for automated backups)
  const authHeader = request.headers.get('authorization')
  const backupKey = process.env.ADMIN_BACKUP_KEY
  
  if (backupKey && authHeader === `Bearer ${backupKey}`) {
    return { authorized: true }
  }
  
  // Option 2: Check for authenticated admin session
  const auth = await getAuthUser(request)
  if (auth.success && isAdmin(auth.user.role)) {
    return { authorized: true }
  }
  
  return { 
    authorized: false, 
    error: 'Unauthorized. Provide valid Authorization header or admin session.' 
  }
}

// ============================================
// List All Media
// ============================================

export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifyAuth(request)
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: 401 })
    }

    const client = getR2Client()
    const bucketName = process.env.R2_BUCKET_NAME || 'yemenpedia-media'

    let allObjects: Array<{
      key: string
      size: number
      lastModified: Date
      etag: string
    }> = []
    
    let continuationToken: string | undefined
    
    do {
      const response = await client.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          ContinuationToken: continuationToken,
          MaxKeys: 1000,
        })
      )

      if (response.Contents) {
        allObjects.push(
          ...response.Contents.map((obj) => ({
            key: obj.Key!,
            size: obj.Size!,
            lastModified: obj.LastModified!,
            etag: obj.ETag!,
          }))
        )
      }

      continuationToken = response.NextContinuationToken
    } while (continuationToken)

    const totalSize = allObjects.reduce((sum, obj) => sum + obj.size, 0)
    const images = allObjects.filter((obj) => obj.key.startsWith('images/'))
    const videos = allObjects.filter((obj) => obj.key.startsWith('videos/'))
    const audio = allObjects.filter((obj) => obj.key.startsWith('audio/'))
    const documents = allObjects.filter((obj) => obj.key.startsWith('documents/'))

    return NextResponse.json({
      success: true,
      stats: {
        totalFiles: allObjects.length,
        totalSize: totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        byType: {
          images: images.length,
          videos: videos.length,
          audio: audio.length,
          documents: documents.length,
        },
      },
      files: allObjects.slice(0, 100),
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to list media' },
      { status: 500 }
    )
  }
}

// ============================================
// Backup Media to Local
// ============================================

export async function POST(request: NextRequest) {
  try {
    const authCheck = await verifyAuth(request)
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const dryRun = body.dryRun ?? true

    const client = getR2Client()
    const bucketName = process.env.R2_BUCKET_NAME || 'yemenpedia-media'
    const backupPath = process.env.BACKUP_LOCAL_PATH || './backups/media'

    let allObjects: Array<{ key: string; size: number }> = []
    let continuationToken: string | undefined
    
    do {
      const response = await client.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          ContinuationToken: continuationToken,
          MaxKeys: 1000,
        })
      )

      if (response.Contents) {
        allObjects.push(
          ...response.Contents.map((obj) => ({
            key: obj.Key!,
            size: obj.Size!,
          }))
        )
      }

      continuationToken = response.NextContinuationToken
    } while (continuationToken)

    if (dryRun) {
      return NextResponse.json({
        success: true,
        message: 'Dry run completed',
        filesToBackup: allObjects.length,
        totalSize: `${(allObjects.reduce((s, o) => s + o.size, 0) / (1024 * 1024)).toFixed(2)} MB`,
        backupPath,
        note: 'Set dryRun: false in request body to perform actual backup',
      })
    }

    if (!existsSync(backupPath)) {
      await mkdir(backupPath, { recursive: true })
    }

    let backedUp = 0
    let failed = 0
    const errors: string[] = []

    for (const obj of allObjects) {
      try {
        const filePath = path.join(backupPath, obj.key)
        const dir = path.dirname(filePath)
        
        if (!existsSync(dir)) {
          await mkdir(dir, { recursive: true })
        }

        const response = await client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: obj.key,
          })
        )

        if (response.Body) {
          const body = await response.Body.transformToByteArray()
          await writeFile(filePath, Buffer.from(body))
          backedUp++
        }
      } catch (error) {
        failed++
        errors.push(`${obj.key}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Backup completed',
      stats: {
        total: allObjects.length,
        backedUp,
        failed,
      },
      errors: errors.slice(0, 10),
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Backup failed' },
      { status: 500 }
    )
  }
}

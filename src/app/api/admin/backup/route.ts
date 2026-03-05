/**
 * Backup Utility for R2 Media
 * 
 * Hidden admin route to sync all R2 media to local /backups folder
 * GET /api/admin/backup/media - List all media
 * POST /api/admin/backup/media - Start backup
 * 
 * Security: Should be protected by admin authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// R2 Client
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

// ============================================
// List All Media
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Verify admin access (TODO: Add proper authentication)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_BACKUP_KEY || 'backup-key'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = getR2Client()
    const bucketName = process.env.R2_BUCKET_NAME || 'yemenpedia-media'

    // List all objects in R2
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

    // Calculate stats
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
      files: allObjects.slice(0, 100), // First 100 files
    })
  } catch (error) {
    console.error('Backup list error:', error)
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
    // Verify admin access
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_BACKUP_KEY || 'backup-key'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const dryRun = body.dryRun ?? true // Default to dry run for safety

    const client = getR2Client()
    const bucketName = process.env.R2_BUCKET_NAME || 'yemenpedia-media'
    const backupPath = process.env.BACKUP_LOCAL_PATH || './backups/media'

    // List all objects
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

    // Create backup directory
    if (!existsSync(backupPath)) {
      await mkdir(backupPath, { recursive: true })
    }

    // Download and save each file
    let backedUp = 0
    let failed = 0
    const errors: string[] = []

    for (const obj of allObjects) {
      try {
        // Create directory structure
        const filePath = path.join(backupPath, obj.key)
        const dir = path.dirname(filePath)
        
        if (!existsSync(dir)) {
          await mkdir(dir, { recursive: true })
        }

        // Download from R2
        const response = await client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: obj.key,
          })
        )

        // Save to local
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
      errors: errors.slice(0, 10), // First 10 errors
    })
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json(
      { success: false, error: 'Backup failed' },
      { status: 500 }
    )
  }
}

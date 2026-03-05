/**
 * Storage Configuration - CLOUD ONLY
 * 
 * GOVERNANCE: Article I, Section 1.2
 * - Images: Cloudflare R2
 * - Videos: Bunny Stream
 * - Local Storage: STRICTLY BANNED
 * 
 * This module enforces cloud-only storage.
 */

export type StorageProvider = 'r2' | 'bunny'

export interface StorageConfig {
  // Default provider for each media type - CLOUD ONLY
  imageProvider: 'r2'
  videoProvider: 'bunny'
  documentProvider: 'r2'
  
  // Cloudflare R2 Configuration (Images & Documents)
  r2: {
    accountId: string
    accessKeyId: string
    secretAccessKey: string
    bucketName: string
    endpoint: string
    publicUrl: string
  }
  
  // Bunny.net Stream Configuration (Videos)
  bunny: {
    libraryId: string
    apiKey: string
    cdnHostname: string
  }
}

// Get configuration from environment variables
export function getStorageConfig(): StorageConfig {
  const requiredVars = {
    'R2_ACCOUNT_ID': process.env.R2_ACCOUNT_ID,
    'R2_ACCESS_KEY_ID': process.env.R2_ACCESS_KEY_ID,
    'R2_SECRET_ACCESS_KEY': process.env.R2_SECRET_ACCESS_KEY,
    'R2_BUCKET_NAME': process.env.R2_BUCKET_NAME,
    'R2_ENDPOINT': process.env.R2_ENDPOINT,
    'R2_PUBLIC_URL': process.env.R2_PUBLIC_URL,
    'BUNNY_LIBRARY_ID': process.env.BUNNY_LIBRARY_ID,
    'BUNNY_API_KEY': process.env.BUNNY_API_KEY,
    'BUNNY_CDN_HOSTNAME': process.env.BUNNY_CDN_HOSTNAME,
  }

  // Check for missing variables
  const missing = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    console.error(`Missing required storage environment variables: ${missing.join(', ')}`)
  }

  return {
    imageProvider: 'r2',
    videoProvider: 'bunny',
    documentProvider: 'r2',
    
    r2: {
      accountId: process.env.R2_ACCOUNT_ID || '',
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      bucketName: process.env.R2_BUCKET_NAME || 'yemenpedia-media',
      endpoint: process.env.R2_ENDPOINT || '',
      publicUrl: process.env.R2_PUBLIC_URL || '',
    },
    
    bunny: {
      libraryId: process.env.BUNNY_LIBRARY_ID || '',
      apiKey: process.env.BUNNY_API_KEY || '',
      cdnHostname: process.env.BUNNY_CDN_HOSTNAME || '',
    },
  }
}

// Validate that required cloud configuration is present
export function validateStorageConfig(): { valid: boolean; missing: string[] } {
  const config = getStorageConfig()
  const missing: string[] = []
  
  // R2 is required for images and documents
  if (!config.r2.accountId) missing.push('R2_ACCOUNT_ID')
  if (!config.r2.accessKeyId) missing.push('R2_ACCESS_KEY_ID')
  if (!config.r2.secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY')
  if (!config.r2.bucketName) missing.push('R2_BUCKET_NAME')
  if (!config.r2.endpoint) missing.push('R2_ENDPOINT')
  if (!config.r2.publicUrl) missing.push('R2_PUBLIC_URL')
  
  // Bunny is required for videos
  if (!config.bunny.libraryId) missing.push('BUNNY_LIBRARY_ID')
  if (!config.bunny.apiKey) missing.push('BUNNY_API_KEY')
  if (!config.bunny.cdnHostname) missing.push('BUNNY_CDN_HOSTNAME')
  
  return {
    valid: missing.length === 0,
    missing
  }
}

// Helper to check if URL is from cloud storage
export function isCloudStorageUrl(url: string): boolean {
  const config = getStorageConfig()
  return url.startsWith(config.r2.publicUrl) || 
         url.includes(config.bunny.cdnHostname)
}

/**
 * MediaPicker Component
 * 
 * Unified media selection component for:
 * - Uploading new images (with automatic processing via MediaService)
 * - URL input for external images
 * 
 * Used by:
 * - Featured Image in write page
 * - Image blocks in editor
 * - Avatar uploads
 */

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================
// Types
// ============================================

export interface MediaPickerResult {
  url: string
  alt?: string
  width?: number
  height?: number
  publicId?: string
}

interface MediaPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (result: MediaPickerResult) => void
  type?: 'image' | 'avatar'
  folder?: string
  title?: string
  locale?: string
}

// ============================================
// Component
// ============================================

export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  type = 'image',
  folder = 'articles',
  title,
  locale = 'ar',
}: MediaPickerProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload')
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [altText, setAltText] = useState('')
  
  const isRTL = locale === 'ar'
  const dialogTitle = title || (isRTL ? 'اختر صورة' : 'Select Image')

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setPreviewUrl(null)
      setUploadError(null)
      setUrlInput('')
      setAltText('')
      setActiveTab('upload')
    }
  }, [open])

  // ============================================
  // File Upload
  // ============================================

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      setUploadError(isRTL ? 'نوع الملف غير مدعوم. يُسمح بـ JPG, PNG, WebP, GIF' : 'Invalid file type. Allowed: JPG, PNG, WebP, GIF')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(isRTL ? 'حجم الملف كبير جداً. الحد الأقصى 10MB' : 'File too large. Max: 10MB')
      return
    }

    setIsUploading(true)
    setUploadError(null)

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      formData.append('slug', folder)
      formData.append('altText', altText)

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        onSelect({
          url: result.data.url,
          alt: altText,
          width: result.data.width,
          height: result.data.height,
          publicId: result.data.publicId,
        })
        onOpenChange(false)
      } else {
        setUploadError(result.error || (isRTL ? 'فشل رفع الصورة' : 'Upload failed'))
        setPreviewUrl(null)
      }
    } catch (error) {
      setUploadError(isRTL ? 'حدث خطأ أثناء الرفع' : 'Upload error')
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
    }
  }, [type, folder, altText, onSelect, onOpenChange, isRTL])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    multiple: false,
    onDrop: (files) => {
      if (files[0]) {
        handleFileSelect(files[0])
      }
    },
    disabled: isUploading,
  })

  // ============================================
  // URL Input
  // ============================================

  const handleUrlSubmit = useCallback(() => {
    if (!urlInput.trim()) return

    // Basic URL validation
    try {
      new URL(urlInput)
    } catch {
      setUploadError(isRTL ? 'الرابط غير صالح' : 'Invalid URL')
      return
    }

    onSelect({
      url: urlInput,
      alt: altText,
    })
    onOpenChange(false)
  }, [urlInput, altText, onSelect, onOpenChange, isRTL])

  // ============================================
  // Render
  // ============================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'url')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {isRTL ? 'رفع' : 'Upload'}
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              {isRTL ? 'رابط' : 'URL'}
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            {/* Alt Text */}
            <div className="space-y-2">
              <Label htmlFor="alt-text">
                {isRTL ? 'النص البديل' : 'Alt Text'}
                <span className="text-destructive mr-1">*</span>
                <span className="text-xs text-zinc-400 font-normal">
                  {isRTL ? '(مطلوب للوصول)' : '(required for accessibility)'}
                </span>
              </Label>
              <Input
                id="alt-text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder={isRTL ? 'وصف مختصر للصورة...' : 'Brief image description...'}
                disabled={isUploading}
              />
            </div>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-primary bg-primary/5' : 'border-zinc-300 hover:border-primary',
                isUploading && 'opacity-50 cursor-not-allowed'
              )}
            >
              <input {...getInputProps()} />
              
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <ImageIcon className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
                  <p className="text-zinc-600 font-medium">
                    {isDragActive
                      ? isRTL ? 'اسقط الصورة هنا' : 'Drop image here'
                      : isRTL ? 'اسحب وأفلت صورة هنا' : 'Drag & drop an image here'
                    }
                  </p>
                  <p className="text-zinc-400 text-sm mt-1">
                    {isRTL ? 'أو اضغط للاختيار' : 'or click to select'}
                  </p>
                  <p className="text-zinc-400 text-xs mt-2">
                    JPG, PNG, WebP, GIF • {isRTL ? 'حد أقصى 10MB' : 'Max 10MB'}
                  </p>
                </>
              )}
            </div>

            {/* Error */}
            {uploadError && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {uploadError}
              </div>
            )}
          </TabsContent>

          {/* URL Tab */}
          <TabsContent value="url" className="space-y-4">
            {/* Alt Text */}
            <div className="space-y-2">
              <Label htmlFor="url-alt-text">
                {isRTL ? 'النص البديل' : 'Alt Text'}
                <span className="text-destructive mr-1">*</span>
              </Label>
              <Input
                id="url-alt-text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder={isRTL ? 'وصف مختصر للصورة...' : 'Brief image description...'}
              />
            </div>

            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="image-url">
                {isRTL ? 'رابط الصورة' : 'Image URL'}
              </Label>
              <Input
                id="image-url"
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                dir="ltr"
              />
            </div>

            {/* URL Preview */}
            {urlInput && (
              <div className="rounded-lg overflow-hidden border">
                <img
                  src={urlInput}
                  alt="Preview"
                  className="max-h-48 mx-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim() || !altText.trim()}
              className="w-full bg-zinc-900 hover:bg-zinc-800"
            >
              <Check className={cn('h-4 w-4', isRTL ? 'ml-2' : 'mr-2')} />
              {isRTL ? 'إضافة الصورة' : 'Add Image'}
            </Button>

            {/* Error */}
            {uploadError && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {uploadError}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default MediaPicker

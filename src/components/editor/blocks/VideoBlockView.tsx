/**
 * Video Block View Component
 * 
 * Interactive video block with:
 * - Bunny Stream player
 * - HLS playback support
 * - Thumbnail preview
 * - Caption editing
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import { Video as VideoIcon, Play, Trash2, Edit2, X, Check, Upload, Link } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { VideoBlockProps } from '../types'

// Bunny Stream embed player component
function BunnyPlayer({ 
  videoId, 
  libraryId, 
  thumbnail 
}: { 
  videoId: string
  libraryId: string
  thumbnail?: string
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  
  if (!isPlaying) {
    return (
      <div 
        className="relative w-full aspect-video bg-black rounded-lg overflow-hidden cursor-pointer group"
        onClick={() => setIsPlaying(true)}
      >
        {thumbnail ? (
          <img 
            src={thumbnail} 
            alt="Video thumbnail" 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
            <VideoIcon className="w-16 h-16 text-zinc-600" />
          </div>
        )}
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-8 h-8 text-zinc-900 ml-1" />
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <iframe
      src={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=true`}
      className="w-full aspect-video rounded-lg"
      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
      loading="lazy"
    />
  )
}

export function VideoBlockView({ 
  node, 
  selected, 
  editor, 
  updateAttributes, 
  deleteNode 
}: VideoBlockProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [editCaption, setEditCaption] = useState(node.attrs.caption || '')
  const [editTitle, setEditTitle] = useState(node.attrs.title || '')
  const [videoUrl, setVideoUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { videoId, src, embedUrl, thumbnail, title, caption } = node.attrs
  const hasVideo = videoId && videoId.length > 0
  
  // Use hardcoded library ID since we're in client component
  // In production, this should come from a public env or be fetched from server
  const libraryId = '608086' // Bunny Stream Library ID from governance
  
  useEffect(() => {
    setEditCaption(caption || '')
    setEditTitle(title || '')
  }, [caption, title])
  
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'video')
      formData.append('slug', editor.storage.articleSlug || 'video')
      
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      })
      
      const result = await response.json()
      
      if (result.success && result.data.videoId) {
        updateAttributes({
          videoId: result.data.videoId,
          src: result.data.url,
          embedUrl: result.data.embedUrl,
          thumbnail: result.data.thumbnail,
        })
      } else {
        console.error('Video upload failed:', result.error)
      }
    } catch (error) {
      console.error('Video upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }, [editor, updateAttributes])
  
  const handleEmbedVideo = useCallback(async () => {
    if (!videoUrl.trim()) return
    
    // Extract video ID from Bunny Stream URL or embed code
    let extractedId = videoUrl
    
    // Try to extract from various URL formats
    const patterns = [
      /mediadelivery\.net\/embed\/\d+\/([a-f0-9-]+)/,
      /mediadelivery\.net\/videos\/([a-f0-9-]+)/,
      /^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/,
    ]
    
    for (const pattern of patterns) {
      const match = videoUrl.match(pattern)
      if (match) {
        extractedId = match[1]
        break
      }
    }
    
    // Bunny CDN hostname from governance
    const bunnyCdnHostname = 'vz-1eed252a-025.b-cdn.net'
    
    updateAttributes({
      videoId: extractedId,
      embedUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${extractedId}`,
      thumbnail: `https://${bunnyCdnHostname}/${extractedId}/thumbnail.jpg`,
    })
    
    setVideoUrl('')
    setShowDialog(false)
  }, [videoUrl, libraryId, updateAttributes])
  
  const handleSaveEdit = useCallback(() => {
    updateAttributes({
      title: editTitle,
      caption: editCaption,
    })
    setShowDialog(false)
  }, [editTitle, editCaption, updateAttributes])
  
  return (
    <NodeViewWrapper className={`video-block-wrapper relative ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
      {!hasVideo ? (
        // Upload placeholder
        <div 
          className="border-2 border-dashed border-zinc-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-zinc-50 transition-colors"
          onClick={() => setShowDialog(true)}
        >
          <VideoIcon className="w-12 h-12 mx-auto text-zinc-400 mb-4" />
          <p className="text-zinc-600 font-medium">اضغط لإضافة فيديو</p>
          <p className="text-zinc-400 text-sm mt-1">يدعم: MP4, WebM, MOV</p>
        </div>
      ) : (
        // Video display
        <div className="video-block">
          {/* Toolbar */}
          {selected && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white border rounded-lg shadow-lg p-1 flex gap-1 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDialog(true)}
                title="تعديل"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <div className="w-px bg-zinc-200 mx-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={deleteNode}
                className="text-destructive hover:text-destructive"
                title="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          {/* Video Player */}
          <BunnyPlayer 
            videoId={videoId} 
            libraryId={libraryId}
            thumbnail={thumbnail}
          />
          
          {/* Caption */}
          {caption && (
            <p className="text-center text-zinc-600 text-sm mt-2 italic">
              {caption}
            </p>
          )}
        </div>
      )}
      
      {/* Loading overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-zinc-600">جاري رفع الفيديو...</p>
          </div>
        </div>
      )}
      
      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{hasVideo ? 'تعديل الفيديو' : 'إضافة فيديو'}</DialogTitle>
          </DialogHeader>
          
          {!hasVideo ? (
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">
                  <Upload className="w-4 h-4 ml-2" />
                  رفع
                </TabsTrigger>
                <TabsTrigger value="embed">
                  <Link className="w-4 h-4 ml-2" />
                  تضمين
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="mt-4">
                <div 
                  className="border-2 border-dashed border-zinc-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-zinc-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
                  <p className="text-zinc-600">اضغط لرفع فيديو</p>
                  <p className="text-zinc-400 text-sm mt-1">الحد الأقصى: 500MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="embed" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">رابط الفيديو أو المعرف</Label>
                  <Input
                    id="videoUrl"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="أدخل رابط Bunny Stream أو معرف الفيديو..."
                  />
                  <p className="text-xs text-zinc-400">
                    مثال: https://iframe.mediadelivery.net/embed/123/abc-123...
                  </p>
                </div>
                
                <Button onClick={handleEmbedVideo} disabled={!videoUrl.trim()} className="w-full">
                  تضمين الفيديو
                </Button>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="videoTitle">العنوان</Label>
                <Input
                  id="videoTitle"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="عنوان الفيديو..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="videoCaption">التعليق</Label>
                <Textarea
                  id="videoCaption"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="تعليق يظهر أسفل الفيديو..."
                  rows={2}
                />
              </div>
            </div>
          )}
          
          {hasVideo && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                <X className="w-4 h-4 ml-2" />
                إلغاء
              </Button>
              <Button onClick={handleSaveEdit}>
                <Check className="w-4 h-4 ml-2" />
                حفظ
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </NodeViewWrapper>
  )
}

export default VideoBlockView

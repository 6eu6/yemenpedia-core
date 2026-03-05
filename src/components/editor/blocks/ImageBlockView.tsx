/**
 * Image Block View Component
 * 
 * Interactive image block with:
 * - MediaPicker integration for uploads via MediaService
 * - Mandatory alt text editing
 * - Caption editing
 * - Alignment controls
 * - Lazy loading
 */

'use client'

import { useState, useCallback } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import { Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, Trash2, Edit2, X, Check, AlertTriangle } from 'lucide-react'
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
import { MediaPicker } from '@/components/media'
import type { ImageBlockProps } from '../types'
import type { MediaPickerResult } from '@/components/media'

export function ImageBlockView({ 
  node, 
  selected, 
  editor, 
  updateAttributes, 
  deleteNode 
}: ImageBlockProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [editAlt, setEditAlt] = useState('')
  const [editCaption, setEditCaption] = useState('')
  const [editTitle, setEditTitle] = useState('')
  
  const { src, alt, caption, title, width, height, alignment } = node.attrs
  
  const hasImage = src && src.length > 0
  
  // Check if alt text is missing (accessibility warning)
  const hasAltWarning = hasImage && (!alt || alt.trim() === '')
  
  // Initialize edit values from node attrs (using useMemo pattern to avoid effect)
  const initializedRef = useState(false)
  if (!initializedRef[0] && (alt || caption || title)) {
    initializedRef[1](true)
    setEditAlt(alt || '')
    setEditCaption(caption || '')
    setEditTitle(title || '')
  }

  // Handle image selection from MediaPicker
  const handleImageSelect = useCallback((result: MediaPickerResult) => {
    updateAttributes({
      src: result.url,
      alt: result.alt || editAlt,
      width: result.width,
      height: result.height,
    })
    
    // If we got alt text from the picker, update the edit state too
    if (result.alt) {
      setEditAlt(result.alt)
    }
  }, [updateAttributes, editAlt])
  
  const handleSaveEdit = useCallback(() => {
    updateAttributes({
      alt: editAlt,
      caption: editCaption,
      title: editTitle,
    })
    setShowDialog(false)
  }, [editAlt, editCaption, editTitle, updateAttributes])
  
  const handleAlignment = useCallback((align: 'left' | 'center' | 'right') => {
    updateAttributes({ alignment: align })
  }, [updateAttributes])
  
  const alignmentClass = alignment === 'left' ? 'ml-0 mr-auto' : alignment === 'right' ? 'ml-auto mr-0' : 'mx-auto'
  
  return (
    <NodeViewWrapper className={`image-block-wrapper relative ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
      {!hasImage ? (
        // Upload placeholder
        <div 
          className="border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          onClick={() => setShowMediaPicker(true)}
        >
          <ImageIcon className="w-12 h-12 mx-auto text-zinc-400 mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400 font-medium">اضغط لإضافة صورة</p>
          <p className="text-zinc-400 text-sm mt-1">يدعم: JPG, PNG, WebP</p>
        </div>
      ) : (
        // Image display
        <figure className={`image-block ${alignmentClass}`} style={{ maxWidth: width || '100%' }}>
          {/* Toolbar */}
          {selected && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white border rounded-lg shadow-lg p-1 flex gap-1 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMediaPicker(true)}
                title="تغيير الصورة"
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDialog(true)}
                title="تعديل"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <div className="w-px bg-zinc-200 dark:bg-zinc-600 mx-1" />
              <Button
                variant={alignment === 'left' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleAlignment('left')}
                title="محاذاة لليسار"
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                variant={alignment === 'center' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleAlignment('center')}
                title="توسيط"
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                variant={alignment === 'right' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleAlignment('right')}
                title="محاذاة لليمين"
              >
                <AlignRight className="w-4 h-4" />
              </Button>
              <div className="w-px bg-zinc-200 dark:bg-zinc-600 mx-1" />
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
          
          {/* Image */}
          <img
            src={src}
            alt={alt || ''}
            title={title || ''}
            width={width}
            height={height}
            loading="lazy"
            decoding="async"
            className="rounded-lg max-w-full h-auto"
          />
          
          {/* Alt text warning */}
          {hasAltWarning && selected && (
            <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              النص البديل مطلوب للوصول
            </div>
          )}
          
          {/* Caption */}
          {caption && (
            <figcaption className="text-center text-zinc-600 dark:text-zinc-400 text-sm mt-2 italic">
              {caption}
            </figcaption>
          )}
        </figure>
      )}
      
      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الصورة</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Alt text - MANDATORY */}
            <div className="space-y-2">
              <Label htmlFor="alt" className="flex items-center gap-1">
                النص البديل <span className="text-destructive">*</span>
                <span className="text-xs text-zinc-400">(مطلوب للوصول)</span>
              </Label>
              <Input
                id="alt"
                value={editAlt}
                onChange={(e) => setEditAlt(e.target.value)}
                placeholder="وصف مختصر للصورة..."
                required
              />
            </div>
            
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">العنوان (اختياري)</Label>
              <Input
                id="title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="عنوان الصورة..."
              />
            </div>
            
            {/* Caption */}
            <div className="space-y-2">
              <Label htmlFor="caption">التعليق</Label>
              <Textarea
                id="caption"
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="تعليق يظهر أسفل الصورة..."
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              <X className="w-4 h-4 ml-2" />
              إلغاء
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editAlt.trim()}>
              <Check className="w-4 h-4 ml-2" />
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Picker */}
      <MediaPicker
        open={showMediaPicker}
        onOpenChange={setShowMediaPicker}
        onSelect={handleImageSelect}
        type="image"
        folder="article-content"
        locale="ar"
      />
    </NodeViewWrapper>
  )
}

export default ImageBlockView

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

interface ImageCropPreviewProps {
  file: File | null
  imageType: 'avatar' | 'cover'
  onConfirm: (cropData: { x: number; y: number; width: number; height: number }) => void
  onCancel: () => void
}

// Target dimensions
const TARGET_DIMENSIONS = {
  avatar: { width: 400, height: 400, ratio: 1 },
  cover: { width: 1500, height: 500, ratio: 3 },
}

export function ImageCropPreview({ file, imageType, onConfirm, onCancel }: ImageCropPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [canvasSize, setCanvasSize] = useState({ width: 300, height: 300 })

  const target = TARGET_DIMENSIONS[imageType]

  // Calculate responsive canvas size
  useEffect(() => {
    const updateCanvasSize = () => {
      const maxWidth = Math.min(window.innerWidth - 32, 500)
      const maxHeight = Math.min(window.innerHeight * 0.45, 350)
      
      if (imageType === 'avatar') {
        // Square for avatar
        const size = Math.min(maxWidth, maxHeight)
        setCanvasSize({ width: size, height: size })
      } else {
        // 3:1 ratio for cover
        const width = maxWidth
        const height = Math.min(width / 3, maxHeight)
        setCanvasSize({ width, height })
      }
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [imageType])

  // Load image
  useEffect(() => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        setImage(img)
        
        // Calculate initial scale and position (center crop)
        const imgRatio = img.width / img.height
        const targetRatio = target.ratio
        const canvasRatio = canvasSize.width / canvasSize.height
        
        let initialScale = 1
        if (imgRatio > canvasRatio) {
          initialScale = canvasSize.height / img.height
        } else {
          initialScale = canvasSize.width / img.width
        }
        
        // Center position
        const displayWidth = img.width * initialScale
        const displayHeight = img.height * initialScale
        const initialX = (canvasSize.width - displayWidth) / 2
        const initialY = (canvasSize.height - displayHeight) / 2
        
        setScale(initialScale)
        setPosition({ x: initialX, y: initialY })
        setIsLoading(false)
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }, [file, target, canvasSize])

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !image) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw image
    ctx.drawImage(
      image,
      position.x,
      position.y,
      image.width * scale,
      image.height * scale
    )
  }, [image, scale, position])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  // Handle mouse/touch events for dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    if (canvasRef.current) {
      canvasRef.current.setPointerCapture(e.pointerId)
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    const newPosition = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }
    setPosition(newPosition)
  }

  const handlePointerUp = () => {
    setIsDragging(false)
  }

  // Zoom handlers
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev / 1.2, 0.1))
  }

  const handleReset = () => {
    if (!image) return
    const imgRatio = image.width / image.height
    const canvasRatio = canvasSize.width / canvasSize.height
    
    let initialScale = 1
    if (imgRatio > canvasRatio) {
      initialScale = canvasSize.height / image.height
    } else {
      initialScale = canvasSize.width / image.width
    }
    
    const displayWidth = image.width * initialScale
    const displayHeight = image.height * initialScale
    const initialX = (canvasSize.width - displayWidth) / 2
    const initialY = (canvasSize.height - displayHeight) / 2
    
    setScale(initialScale)
    setPosition({ x: initialX, y: initialY })
  }

  // Calculate crop data
  const getCropData = () => {
    if (!image) return { x: 0, y: 0, width: 0, height: 0 }

    // Calculate crop area on original image
    const cropX = (-position.x / scale)
    const cropY = (-position.y / scale)
    const cropWidth = (canvasSize.width / scale)
    const cropHeight = (canvasSize.height / scale)

    return {
      x: Math.max(0, cropX),
      y: Math.max(0, cropY),
      width: Math.min(cropWidth, image.width - cropX),
      height: Math.min(cropHeight, image.height - cropY),
    }
  }

  if (!file) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white">
          {imageType === 'avatar' ? 'تعديل صورة البروفايل' : 'تعديل صورة الغلاف'}
        </h2>
        <Button variant="ghost" size="icon" onClick={onCancel} className="text-white hover:bg-white/10 rounded-full">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Canvas Area - Flexible with scroll */}
      <div className="flex-1 overflow-auto flex flex-col items-center justify-center p-4 gap-4">
        {isLoading ? (
          <div className="w-64 h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Canvas Container */}
            <div 
              ref={containerRef}
              className="relative overflow-hidden rounded-xl bg-zinc-900 touch-none"
              style={{ 
                width: canvasSize.width, 
                height: canvasSize.height,
              }}
            >
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="cursor-move"
                style={{ touchAction: 'none' }}
              />

              {/* Crop Overlay */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{ 
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                  borderRadius: imageType === 'avatar' ? '50%' : '0.75rem',
                }}
              />

              {/* Grid Lines */}
              <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-white" />
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white" />
              </div>
            </div>

            {/* Controls - Compact */}
            <div className="flex items-center gap-3 bg-white/10 rounded-full px-4 py-2">
              <Button variant="ghost" size="icon" onClick={handleZoomOut} className="text-white hover:bg-white/10 h-8 w-8">
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <div className="w-24">
                <Slider
                  value={[scale * 100]}
                  onValueChange={([value]) => setScale(value / 100)}
                  min={10}
                  max={300}
                  step={1}
                  className="w-full"
                />
              </div>

              <Button variant="ghost" size="icon" onClick={handleZoomIn} className="text-white hover:bg-white/10 h-8 w-8">
                <ZoomIn className="h-4 w-4" />
              </Button>

              <div className="w-px h-4 bg-white/30" />

              <Button variant="ghost" size="icon" onClick={handleReset} className="text-white hover:bg-white/10 h-8 w-8">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Info */}
            <div className="text-center text-white/60 text-xs">
              <p>اسحب لتحريك • {target.width}×{target.height}px</p>
            </div>
          </>
        )}
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="flex-shrink-0 flex items-center justify-center gap-3 p-4 pb-8 bg-black/50 backdrop-blur-sm">
        <Button 
          variant="outline" 
          onClick={onCancel} 
          className="bg-transparent border-white/30 text-white hover:bg-white/10 rounded-full px-6 focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <X className="h-4 w-4 ml-2" />
          إلغاء
        </Button>
        <Button 
          onClick={() => onConfirm(getCropData())} 
          className="bg-zinc-600 hover:bg-zinc-700 text-white rounded-full px-6 focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Check className="h-4 w-4 ml-2" />
          حفظ
        </Button>
      </div>
    </motion.div>
  )
}

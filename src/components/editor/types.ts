/**
 * TipTap Editor Types
 * 
 * Type definitions for the encyclopedia editor
 */

// ============================================
// Node Attributes
// ============================================

export interface ImageNodeAttributes {
  src: string
  alt: string
  title?: string
  caption?: string
  width?: number
  height?: number
  alignment?: 'left' | 'center' | 'right'
  lazy?: boolean
}

export interface VideoNodeAttributes {
  videoId: string
  src: string
  embedUrl: string
  thumbnail?: string
  title?: string
  caption?: string
  width?: number
  height?: number
  alignment?: 'left' | 'center' | 'right'
}

export interface AudioNodeAttributes {
  src: string
  title?: string
  caption?: string
  duration?: number
}

export interface MapNodeAttributes {
  lat: number
  lng: number
  zoom: number
  label?: string
  width?: number
  height?: number
}

export interface CitationNodeAttributes {
  id: string
  title: string
  author?: string
  url?: string
  publisher?: string
  publishDate?: string
  pageNumbers?: string
  isbn?: string
  doi?: string
}

export interface WikiLinkAttributes {
  href: string
  articleId: string
  articleSlug: string
  title?: string
}

// ============================================
// Editor Content Types
// ============================================

export type EditorContentType = 
  | 'paragraph'
  | 'heading'
  | 'bulletList'
  | 'orderedList'
  | 'blockquote'
  | 'codeBlock'
  | 'imageBlock'
  | 'videoBlock'
  | 'audioBlock'
  | 'mapBlock'
  | 'citationBlock'
  | 'horizontalRule'

export interface TipTapContent {
  type: 'doc'
  content: TipTapNode[]
}

export interface TipTapNode {
  type: string
  content?: TipTapNode[]
  text?: string
  marks?: TipTapMark[]
  attrs?: Record<string, any>
}

export interface TipTapMark {
  type: string
  attrs?: Record<string, any>
}

// ============================================
// Editor Props
// ============================================

export interface EditorProps {
  content?: TipTapContent | null
  placeholder?: string
  editable?: boolean
  onContentChange?: (content: TipTapContent) => void
  onAutoSave?: (content: TipTapContent) => void
  articleId?: string
  articleSlug?: string
}

export interface EditorToolbarProps {
  editor: any // TipTap editor instance
  onImageUpload?: () => void
  onVideoUpload?: () => void
  onAudioUpload?: () => void
  onMapInsert?: () => void
  onCitationInsert?: () => void
}

// ============================================
// Upload Types
// ============================================

export type UploadContext = 'article' | 'avatar' | 'cover' | 'gallery' | 'citation'

export interface MediaUploadResult {
  success: boolean
  url: string
  publicId: string
  thumbnail?: string
  width?: number
  height?: number
  size: number
  mimeType: string
  videoId?: string
  embedUrl?: string
  duration?: number
  error?: string
}

// ============================================
// Block Component Props
// ============================================

export interface ImageBlockProps {
  node: {
    attrs: ImageNodeAttributes
  }
  selected: boolean
  editor: any
  updateAttributes: (attrs: Partial<ImageNodeAttributes>) => void
  deleteNode: () => void
}

export interface VideoBlockProps {
  node: {
    attrs: VideoNodeAttributes
  }
  selected: boolean
  editor: any
  updateAttributes: (attrs: Partial<VideoNodeAttributes>) => void
  deleteNode: () => void
}

export interface AudioBlockProps {
  node: {
    attrs: AudioNodeAttributes
  }
  selected: boolean
  editor: any
  updateAttributes: (attrs: Partial<AudioNodeAttributes>) => void
  deleteNode: () => void
}

export interface MapBlockProps {
  node: {
    attrs: MapNodeAttributes
  }
  selected: boolean
  editor: any
  updateAttributes: (attrs: Partial<MapNodeAttributes>) => void
  deleteNode: () => void
}

export interface CitationBlockProps {
  node: {
    attrs: CitationNodeAttributes
  }
  selected: boolean
  editor: any
  updateAttributes: (attrs: Partial<CitationNodeAttributes>) => void
  deleteNode: () => void
}

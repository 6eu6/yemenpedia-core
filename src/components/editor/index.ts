/**
 * Editor Components Index
 * 
 * Exports all editor components
 */

export { TipTapEditor } from './TipTapEditor'
export type { TipTapEditorProps } from './TipTapEditor'

export { EditorToolbar } from './EditorToolbar'

// Types
export type {
  ImageNodeAttributes,
  VideoNodeAttributes,
  AudioNodeAttributes,
  MapNodeAttributes,
  CitationNodeAttributes,
  WikiLinkAttributes,
  EditorProps,
  EditorToolbarProps,
  TipTapContent,
  TipTapNode,
  TipTapMark,
  MediaUploadResult,
  UploadContext,
} from './types'

// Extensions
export { ImageBlock } from './extensions/ImageBlock'
export { VideoBlock } from './extensions/VideoBlock'
export { MapBlock } from './extensions/MapBlock'
export { CitationBlock } from './extensions/CitationBlock'

/**
 * Custom Video Extension for TipTap
 * 
 * Features:
 * - Bunny Stream integration
 * - HLS playback
 * - Thumbnail preview
 * - Caption support
 * - Responsive sizing
 */

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { VideoBlockView } from '../blocks/VideoBlockView'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    videoBlock: {
      /**
       * Insert a video block
       */
      insertVideoBlock: (attrs: {
        videoId: string
        src: string
        embedUrl: string
        thumbnail?: string
        title?: string
        caption?: string
        width?: number
        height?: number
      }) => ReturnType
      /**
       * Update video block attributes
       */
      updateVideoBlock: (attrs: Partial<{
        videoId: string
        src: string
        embedUrl: string
        thumbnail: string
        title: string
        caption: string
        width: number
        height: number
      }>) => ReturnType
      /**
       * Delete the video block
       */
      deleteVideoBlock: () => ReturnType
    }
  }
}

export interface VideoBlockOptions {
  HTMLAttributes: Record<string, any>
}

export const VideoBlock = Node.create<VideoBlockOptions>({
  name: 'videoBlock',
  
  group: 'block',
  
  atom: true,
  
  draggable: true,
  
  selectable: true,
  
  addOptions() {
    return {
      HTMLAttributes: {
        class: 'video-block',
      },
    }
  },
  
  addAttributes() {
    return {
      videoId: {
        default: null,
        parseHTML: element => element.getAttribute('data-video-id'),
        renderHTML: attributes => {
          if (!attributes.videoId) return {}
          return {
            'data-video-id': attributes.videoId,
          }
        },
      },
      
      src: {
        default: null,
        parseHTML: element => element.querySelector('video')?.getAttribute('src') ||
                           element.getAttribute('data-src'),
      },
      
      embedUrl: {
        default: null,
        parseHTML: element => element.getAttribute('data-embed-url'),
      },
      
      thumbnail: {
        default: null,
        parseHTML: element => element.getAttribute('data-thumbnail'),
      },
      
      title: {
        default: '',
        parseHTML: element => element.querySelector('figcaption')?.getAttribute('data-title') || '',
      },
      
      caption: {
        default: '',
        parseHTML: element => element.querySelector('figcaption')?.textContent || '',
      },
      
      width: {
        default: null,
        parseHTML: element => {
          const width = element.getAttribute('data-width')
          return width ? parseInt(width) : null
        },
      },
      
      height: {
        default: null,
        parseHTML: element => {
          const height = element.getAttribute('data-height')
          return height ? parseInt(height) : null
        },
      },
      
      alignment: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-alignment') || 'center',
        renderHTML: attributes => ({
          'data-alignment': attributes.alignment,
        }),
      },
    }
  },
  
  parseHTML() {
    return [
      {
        tag: 'figure[data-type="video-block"]',
      },
    ]
  },
  
  renderHTML({ HTMLAttributes, node }) {
    const { videoId, src, embedUrl, thumbnail, title, caption, width, height, alignment } = node.attrs

    // بناء مصفوفة العناصر مع تصفية القيم الفارغة
    const children = [
      [
        'div',
        { class: 'video-container aspect-video bg-zinc-100 rounded-lg overflow-hidden' },
        thumbnail ? ['img', { src: thumbnail, alt: title || 'Video thumbnail', class: 'w-full h-full object-cover' }] : '',
        ['div', { class: 'play-button-overlay' }],
      ].filter(Boolean),
      caption ? ['figcaption', { class: 'text-sm text-zinc-600 mt-2 text-center' }, caption] : '',
    ].filter(Boolean)

    return [
      'figure',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'video-block',
        'data-video-id': videoId,
        'data-src': src,
        'data-embed-url': embedUrl,
        'data-thumbnail': thumbnail,
        'data-title': title,
        'data-width': width,
        'data-height': height,
        'data-alignment': alignment,
        class: 'video-block',
      }),
      ...children,
    ]
  },
  
  addNodeView() {
    // @ts-expect-error - ReactNodeViewRenderer type mismatch is expected
    return ReactNodeViewRenderer(VideoBlockView)
  },
  
  addCommands() {
    return {
      insertVideoBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          })
        },
      
      updateVideoBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, attrs)
        },
      
      deleteVideoBlock:
        () =>
        ({ commands }) => {
          return commands.deleteSelection()
        },
    }
  },
})

export default VideoBlock

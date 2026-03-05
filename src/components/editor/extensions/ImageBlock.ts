/**
 * Custom Image Extension for TipTap
 * 
 * Features:
 * - R2 Storage integration
 * - Mandatory alt text (accessibility)
 * - Lazy loading
 * - Caption support
 * - Alignment options
 */

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ImageBlockView } from '../blocks/ImageBlockView'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageBlock: {
      /**
       * Insert an image block
       */
      insertImageBlock: (attrs: {
        src: string
        alt: string
        caption?: string
        title?: string
        width?: number
        height?: number
        alignment?: 'left' | 'center' | 'right'
      }) => ReturnType
      /**
       * Update image block attributes
       */
      updateImageBlock: (attrs: Partial<{
        src: string
        alt: string
        caption: string
        title: string
        width: number
        height: number
        alignment: 'left' | 'center' | 'right'
      }>) => ReturnType
      /**
       * Delete the image block
       */
      deleteImageBlock: () => ReturnType
    }
  }
}

export interface ImageBlockOptions {
  HTMLAttributes: Record<string, any>
}

export const ImageBlock = Node.create<ImageBlockOptions>({
  name: 'imageBlock',
  
  group: 'block',
  
  atom: true,
  
  draggable: true,
  
  selectable: true,
  
  addOptions() {
    return {
      HTMLAttributes: {
        class: 'image-block',
      },
    }
  },
  
  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => element.querySelector('img')?.getAttribute('src'),
        renderHTML: attributes => {
          if (!attributes.src) return {}
          return {}
        },
      },
      
      alt: {
        default: '',
        parseHTML: element => element.querySelector('img')?.getAttribute('alt') || '',
        renderHTML: attributes => {
          return {}
        },
      },
      
      title: {
        default: null,
        parseHTML: element => element.querySelector('img')?.getAttribute('title'),
      },
      
      caption: {
        default: '',
        parseHTML: element => element.querySelector('figcaption')?.textContent || '',
      },
      
      width: {
        default: null,
        parseHTML: element => {
          const width = element.querySelector('img')?.getAttribute('width')
          return width ? parseInt(width) : null
        },
      },
      
      height: {
        default: null,
        parseHTML: element => {
          const height = element.querySelector('img')?.getAttribute('height')
          return height ? parseInt(height) : null
        },
      },
      
      alignment: {
        default: 'center',
        parseHTML: element => {
          const align = element.getAttribute('data-alignment')
          return align || 'center'
        },
        renderHTML: attributes => {
          return {
            'data-alignment': attributes.alignment,
          }
        },
      },
      
      lazy: {
        default: true,
        parseHTML: () => true,
      },
    }
  },
  
  parseHTML() {
    return [
      {
        tag: 'figure[data-type="image-block"]',
      },
      {
        tag: 'figure.image-block',
      },
    ]
  },
  
  renderHTML({ HTMLAttributes, node }) {
    const alignment = node.attrs.alignment || 'center'
    const alignClass = `align-${alignment}`

    // بناء مصفوفة العناصر مع تصفية القيم الفارغة
    const children = [
      [
        'img',
        {
          src: node.attrs.src || '',
          alt: node.attrs.alt || '',
          title: node.attrs.title || '',
          width: node.attrs.width,
          height: node.attrs.height,
          loading: 'lazy',
          decoding: 'async',
        },
      ],
      node.attrs.caption ? ['figcaption', node.attrs.caption] : '',
    ].filter(Boolean)

    return [
      'figure',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'image-block',
        class: `image-block ${alignClass}`,
      }),
      ...children,
    ]
  },
  
  addNodeView() {
    // @ts-expect-error - ReactNodeViewRenderer type mismatch is expected
    return ReactNodeViewRenderer(ImageBlockView)
  },
  
  addCommands() {
    return {
      insertImageBlock:
        (attrs) =>
        ({ commands, editor }) => {
          // Validate required alt text
          if (!attrs.alt || attrs.alt.trim() === '') {
            console.warn('Image block requires alt text for accessibility')
            return false
          }
          
          return commands.insertContent({
            type: this.name,
            attrs,
          })
        },
      
      updateImageBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, attrs)
        },
      
      deleteImageBlock:
        () =>
        ({ commands }) => {
          return commands.deleteSelection()
        },
    }
  },
})

export default ImageBlock

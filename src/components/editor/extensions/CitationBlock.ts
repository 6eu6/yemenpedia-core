/**
 * Custom Citation Extension for TipTap
 * 
 * Features:
 * - Academic/historical references
 * - Multiple citation formats
 * - Footnote-style numbering
 */

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { CitationBlockView } from '../blocks/CitationBlockView'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    citationBlock: {
      /**
       * Insert a citation block
       */
      insertCitationBlock: (attrs: {
        id: string
        title: string
        author?: string
        url?: string
        publisher?: string
        publishDate?: string
        pageNumbers?: string
        isbn?: string
        doi?: string
      }) => ReturnType
      /**
       * Update citation block attributes
       */
      updateCitationBlock: (attrs: Partial<{
        id: string
        title: string
        author: string
        url: string
        publisher: string
        publishDate: string
        pageNumbers: string
        isbn: string
        doi: string
      }>) => ReturnType
      /**
       * Delete the citation block
       */
      deleteCitationBlock: () => ReturnType
    }
  }
}

export interface CitationBlockOptions {
  HTMLAttributes: Record<string, any>
}

export const CitationBlock = Node.create<CitationBlockOptions>({
  name: 'citationBlock',
  
  group: 'block',
  
  atom: true,
  
  draggable: true,
  
  selectable: true,
  
  addOptions() {
    return {
      HTMLAttributes: {
        class: 'citation-block',
      },
    }
  },
  
  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-citation-id'),
        renderHTML: attributes => {
          if (!attributes.id) return {}
          return {
            'data-citation-id': attributes.id,
          }
        },
      },
      
      title: {
        default: '',
        parseHTML: element => element.getAttribute('data-title') || '',
      },
      
      author: {
        default: '',
        parseHTML: element => element.getAttribute('data-author') || '',
      },
      
      url: {
        default: '',
        parseHTML: element => element.getAttribute('data-url') || '',
      },
      
      publisher: {
        default: '',
        parseHTML: element => element.getAttribute('data-publisher') || '',
      },
      
      publishDate: {
        default: '',
        parseHTML: element => element.getAttribute('data-publish-date') || '',
      },
      
      pageNumbers: {
        default: '',
        parseHTML: element => element.getAttribute('data-pages') || '',
      },
      
      isbn: {
        default: '',
        parseHTML: element => element.getAttribute('data-isbn') || '',
      },
      
      doi: {
        default: '',
        parseHTML: element => element.getAttribute('data-doi') || '',
      },
      
      number: {
        default: 1,
        parseHTML: element => parseInt(element.getAttribute('data-number') || '1'),
        renderHTML: attributes => ({
          'data-number': attributes.number,
        }),
      },
    }
  },
  
  parseHTML() {
    return [
      {
        tag: 'div[data-type="citation-block"]',
      },
    ]
  },
  
  renderHTML({ HTMLAttributes, node }) {
    const { title, author, publisher, publishDate, pageNumbers, number } = node.attrs

    // بناء مصفوفة العناصر مع تصفية القيم الفارغة
    const citationDetails = [
      ['cite', { class: 'not-italic' }, title],
      author ? ['span', { class: 'text-zinc-600' }, ` - ${author}`] : '',
      publisher ? ['span', { class: 'text-zinc-500' }, `, ${publisher}`] : '',
      publishDate ? ['span', { class: 'text-zinc-500' }, ` (${publishDate})`] : '',
      pageNumbers ? ['span', { class: 'text-zinc-500' }, `, ص ${pageNumbers}`] : '',
    ].filter(Boolean)

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'citation-block',
        class: 'citation-block bg-zinc-50 border-r-4 border-primary p-4 rounded-lg my-4',
      }),
      [
        'div',
        { class: 'flex gap-3' },
        ['span', { class: 'text-primary font-bold text-lg' }, `[${number}]`],
        ['div', { class: 'flex-1' }, ...citationDetails],
      ],
    ]
  },
  
  addNodeView() {
    // @ts-expect-error - ReactNodeViewRenderer type mismatch is expected
    return ReactNodeViewRenderer(CitationBlockView)
  },
  
  addCommands() {
    return {
      insertCitationBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              ...attrs,
              id: attrs.id || `cite-${Date.now()}`,
            },
          })
        },
      
      updateCitationBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, attrs)
        },
      
      deleteCitationBlock:
        () =>
        ({ commands }) => {
          return commands.deleteSelection()
        },
    }
  },
})

export default CitationBlock

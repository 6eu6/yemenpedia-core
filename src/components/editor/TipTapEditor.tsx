/**
 * Encyclopedia TipTap Editor
 * 
 * Block-based editor for encyclopedia articles with:
 * - RTL Support for Arabic
 * - Custom blocks: Image, Video, Map, Citation
 * - Wiki-link integration
 * - Media picker
 */

'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
// GOVERNANCE: استيراد من المسار الفرعي لتجنب barrel optimization issues
import { TextStyle } from '@tiptap/extension-text-style/text-style'
import Color from '@tiptap/extension-color'
import { EditorToolbar } from './EditorToolbar'
import { ImageBlock } from './extensions/ImageBlock'
import { VideoBlock } from './extensions/VideoBlock'
import { MapBlock } from './extensions/MapBlock'
import { CitationBlock } from './extensions/CitationBlock'
import type { TipTapContent } from './types'

// ============================================
// Editor Styles (CSS)
// ============================================

const editorStyles = `
  .prose-editor {
    outline: none;
    min-height: 400px;
    padding: 1.5rem;
    line-height: 1.8;
    font-size: 1.125rem;
  }
  
  .prose-editor p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: right;
    color: #adb5bd;
    pointer-events: none;
    height: 0;
  }
  
  .prose-editor h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    line-height: 1.3;
  }
  
  .prose-editor h2 {
    font-size: 2rem;
    font-weight: 600;
    margin-top: 2rem;
    margin-bottom: 1rem;
    line-height: 1.4;
  }
  
  .prose-editor h3 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
  }
  
  .prose-editor h4 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
  }
  
  .prose-editor p {
    margin-bottom: 1rem;
  }
  
  .prose-editor ul,
  .prose-editor ol {
    padding-right: 1.5rem;
    margin-bottom: 1rem;
  }
  
  .prose-editor li {
    margin-bottom: 0.5rem;
  }
  
  .prose-editor blockquote {
    border-right: 4px solid rgb(127, 29, 29);
    padding-right: 1.5rem;
    margin: 1.5rem 0;
    font-style: italic;
    color: #4b5563;
    background: #f9fafb;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem 0 0 0.5rem;
  }
  
  .prose-editor code {
    background: #f1f5f9;
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
    font-family: monospace;
    font-size: 0.9em;
  }
  
  .prose-editor pre {
    background: #1e293b;
    color: #e2e8f0;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin: 1rem 0;
  }
  
  .prose-editor pre code {
    background: transparent;
    padding: 0;
    color: inherit;
  }
  
  .prose-editor hr {
    border: none;
    border-top: 2px solid #e5e7eb;
    margin: 2rem 0;
  }
  
  .prose-editor a {
    color: rgb(127, 29, 29);
    text-decoration: underline;
    cursor: pointer;
  }
  
  .prose-editor a:hover {
    opacity: 0.8;
  }
  
  .prose-editor .wiki-link {
    color: rgb(127, 29, 29);
    border-bottom: 1px dashed rgb(127, 29, 29);
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .prose-editor .wiki-link:hover {
    background: rgba(127, 29, 29, 0.1);
  }
  
  .prose-editor mark {
    background: #fef08a;
    padding: 0.1rem 0.2rem;
    border-radius: 0.2rem;
  }
  
  /* RTL Support */
  .prose-editor[dir="rtl"] {
    direction: rtl;
    text-align: right;
  }
  
  .prose-editor[dir="rtl"] ul {
    padding-right: 1.5rem;
    padding-left: 0;
  }
  
  /* Selected node styling */
  .prose-editor .ProseMirror-selectednode {
    outline: 2px solid rgb(127, 29, 29);
    outline-offset: 2px;
  }
  
  /* Image block styles */
  .image-block {
    margin: 1.5rem 0;
  }
  
  .image-block img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
  }
  
  .image-block figcaption {
    text-align: center;
    color: #6b7280;
    font-size: 0.875rem;
    margin-top: 0.5rem;
    font-style: italic;
  }
  
  .image-block.align-left {
    margin-left: 0;
    margin-right: auto;
  }
  
  .image-block.align-center {
    margin-left: auto;
    margin-right: auto;
  }
  
  .image-block.align-right {
    margin-left: auto;
    margin-right: 0;
  }
  
  /* Video block styles */
  .video-block {
    margin: 1.5rem 0;
  }
  
  /* Map block styles */
  .map-block {
    margin: 1.5rem 0;
    border-radius: 0.5rem;
    overflow: hidden;
  }
  
  /* Citation block styles */
  .citation-block {
    margin: 1.5rem 0;
    background: #f9fafb;
    border-right: 4px solid rgb(127, 29, 29);
    padding: 1rem;
    border-radius: 0 0.5rem 0.5rem 0;
  }
  
  .citation-block cite {
    font-style: normal;
    font-weight: 500;
  }
`

// ============================================
// Editor Props
// ============================================

export interface TipTapEditorProps {
  content?: TipTapContent | string | null
  placeholder?: string
  editable?: boolean
  onContentChange?: (content: TipTapContent, html: string) => void
  articleSlug?: string
  articleId?: string
}

// ============================================
// TipTap Editor Component
// ============================================

export function TipTapEditor({
  content,
  placeholder = 'ابدأ الكتابة هنا...',
  editable = true,
  onContentChange,
  articleSlug = 'article',
  articleId,
}: TipTapEditorProps) {
  const [isReady, setIsReady] = useState(false)
  
  // Initialize editor
  // GOVERNANCE: immediatelyRender: false to avoid SSR hydration mismatches
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      
      // Text alignment (RTL)
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'right', 'center', 'justify'],
      }),
      
      Underline,
      
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      
      Typography,
      
      TextStyle,
      
      Color,
      
      // Custom extensions
      ImageBlock,
      VideoBlock,
      MapBlock,
      CitationBlock,
    ],
    
    content: content || '',
    
    editable,
    
    editorProps: {
      attributes: {
        class: 'prose-editor',
        dir: 'rtl',
      },
    },
    
    onUpdate: ({ editor }) => {
      // التحقق من أن المحرر في حالة صالحة قبل قراءة المحتوى
      if (!editor || editor.isDestroyed) return

      try {
        const json = editor.getJSON() as TipTapContent
        const html = editor.getHTML()

        // Only notify parent of content change (no auto-save)
        onContentChange?.(json, html)
      } catch (error) {
        // تجاهل أخطاء العناصر الفارغة مؤقتاً
        console.warn('Editor update warning:', error)
      }
    },
    
    onCreate: () => {
      setIsReady(true)
    },
  })
  
  // Store article slug in editor storage for extensions (via extension config)
  // Note: Extensions receive this via their configuration
  
  // Insert commands
  const insertImage = useCallback(() => {
    editor?.chain().focus().insertContent({
      type: 'imageBlock',
      attrs: {
        src: null,
        alt: '',
        caption: '',
      },
    }).run()
  }, [editor])
  
  const insertVideo = useCallback(() => {
    editor?.chain().focus().insertContent({
      type: 'videoBlock',
      attrs: {
        videoId: null,
        src: null,
        embedUrl: null,
      },
    }).run()
  }, [editor])
  
  const insertMap = useCallback(() => {
    editor?.chain().focus().insertContent({
      type: 'mapBlock',
      attrs: {
        lat: 15.5527,
        lng: 48.5164,
        zoom: 10,
        label: '',
      },
    }).run()
  }, [editor])
  
  const insertCitation = useCallback(() => {
    editor?.chain().focus().insertContent({
      type: 'citationBlock',
      attrs: {
        id: `cite-${Date.now()}`,
        title: '',
        number: (editor?.storage.citationCount || 0) + 1,
      },
    }).run()
  }, [editor])
  
  if (!isReady || !editor) {
    return (
      <div className="editor-loading">
        <div className="animate-pulse space-y-4 p-4">
          <div className="h-8 bg-zinc-200 rounded w-3/4"></div>
          <div className="h-4 bg-zinc-200 rounded w-full"></div>
          <div className="h-4 bg-zinc-200 rounded w-5/6"></div>
          <div className="h-4 bg-zinc-200 rounded w-4/6"></div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="tiptap-editor-wrapper">
      {/* Inject styles */}
      <style jsx global>
        {editorStyles}
      </style>
      
      {/* Toolbar */}
      <EditorToolbar
        editor={editor}
        onImageUpload={insertImage}
        onVideoUpload={insertVideo}
        onMapInsert={insertMap}
        onCitationInsert={insertCitation}
      />
      
      {/* Editor Content */}
      <div className="editor-content bg-white border rounded-lg min-h-[500px]">
        <EditorContent editor={editor} />
      </div>
      
      {/* Status bar */}
      <div className="flex items-center justify-between text-sm text-zinc-500 mt-2 px-2">
        <div className="flex items-center gap-4">
          <span>
            {editor.getText().length} حرف
          </span>
          <span>
            {editor.getText().split(/\s+/).filter(Boolean).length} كلمة
          </span>
        </div>
      </div>
    </div>
  )
}

export default TipTapEditor

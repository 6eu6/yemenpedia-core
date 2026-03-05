/**
 * Editor Toolbar Component
 * 
 * Formatting toolbar for TipTap editor with:
 * - Text formatting (bold, italic, underline, etc.)
 * - Headings
 * - Lists
 * - Alignment
 * - Custom blocks
 */

'use client'

import React from 'react'
import type { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
  Unlink,
  Image as ImageIcon,
  Video,
  Map,
  BookOpen,
  Minus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
  title: string
}

function ToolbarButton({ onClick, isActive, disabled, children, title }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isActive ? 'default' : 'ghost'}
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{title}</p>
      </TooltipContent>
    </Tooltip>
  )
}

interface EditorToolbarProps {
  editor: Editor
  onImageUpload?: () => void
  onVideoUpload?: () => void
  onMapInsert?: () => void
  onCitationInsert?: () => void
}

export function EditorToolbar({
  editor,
  onImageUpload,
  onVideoUpload,
  onMapInsert,
  onCitationInsert,
}: EditorToolbarProps) {
  const [linkUrl, setLinkUrl] = React.useState('')

  const setLink = () => {
    if (linkUrl === '') {
      editor.chain().focus().unsetLink().run()
      return
    }

    editor
      .chain()
      .focus()
      .setLink({ href: linkUrl })
      .run()
    setLinkUrl('')
  }

  if (!editor) return null

  return (
    <TooltipProvider>
      <div className="editor-toolbar border-b bg-zinc-50 dark:bg-zinc-800 rounded-t-lg p-2 flex flex-wrap items-center gap-1" dir="rtl">
        {/* Undo/Redo */}
        <div className="flex items-center gap-1 border-l pl-2 ml-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="تراجع (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="إعادة (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-l pl-2 ml-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="عريض (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="مائل (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="تسطير (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="يتوسطه خط"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="كود"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 border-l pl-2 ml-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="عنوان رئيسي"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="عنوان فرعي"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="عنوان ثانوي"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-l pl-2 ml-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="قائمة نقطية"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="قائمة مرقمة"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="اقتباس"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 border-l pl-2 ml-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="محاذاة لليمين"
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="توسيط"
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="محاذاة لليسار"
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            title="ضبط"
          >
            <AlignJustify className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Link */}
        <div className="flex items-center gap-1 border-l pl-2 ml-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={editor.isActive('link') ? 'default' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Link className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" dir="rtl">
              <div className="space-y-2">
                <Label htmlFor="link-url">رابط</Label>
                <div className="flex gap-2">
                  <Input
                    id="link-url"
                    type="url"
                    placeholder="https://..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="flex-1"
                    dir="ltr"
                  />
                  <Button onClick={setLink} size="sm">
                    تطبيق
                  </Button>
                </div>
                {editor.isActive('link') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editor.chain().focus().unsetLink().run()}
                    className="w-full"
                  >
                    <Unlink className="w-4 h-4 ml-2" />
                    إزالة الرابط
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Custom Blocks */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={onImageUpload || (() => {})}
            title="إدراج صورة"
          >
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={onVideoUpload || (() => {})}
            title="إدراج فيديو"
          >
            <Video className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={onMapInsert || (() => {})}
            title="إدراج خريطة"
          >
            <Map className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={onCitationInsert || (() => {})}
            title="إدراج مرجع"
          >
            <BookOpen className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Horizontal Rule */}
        <div className="flex items-center mr-auto">
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="خط أفقي"
          >
            <Minus className="w-4 h-4" />
          </ToolbarButton>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default EditorToolbar

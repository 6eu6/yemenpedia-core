/**
 * Citation Block View Component
 * 
 * Interactive citation block with:
 * - Reference editing
 * - Multiple citation fields
 * - Preview
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import { BookOpen, Trash2, Edit2, X, Check, ExternalLink, Link, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { CitationBlockProps, CitationNodeAttributes } from '../types'

export function CitationBlockView({ 
  node, 
  selected, 
  editor, 
  updateAttributes, 
  deleteNode 
}: CitationBlockProps) {
  const [showDialog, setShowDialog] = useState(false)
  
  // Use useMemo to derive initial state from props
  const initialForm = useMemo(() => ({
    title: node.attrs.title || '',
    author: node.attrs.author || '',
    url: node.attrs.url || '',
    publisher: node.attrs.publisher || '',
    publishDate: node.attrs.publishDate || '',
    pageNumbers: node.attrs.pageNumbers || '',
    isbn: node.attrs.isbn || '',
    doi: node.attrs.doi || '',
  }), [node.attrs.title, node.attrs.author, node.attrs.url, node.attrs.publisher, 
      node.attrs.publishDate, node.attrs.pageNumbers, node.attrs.isbn, node.attrs.doi])
  
  const [editForm, setEditForm] = useState(initialForm)
  
  const { title, author, url, publisher, publishDate, pageNumbers, number } = node.attrs
  
  const handleSaveEdit = useCallback(() => {
    updateAttributes(editForm)
    setShowDialog(false)
  }, [editForm, updateAttributes])
  
  const updateFormField = useCallback((field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }, [])
  
  return (
    <NodeViewWrapper className={`citation-block-wrapper relative ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
      {/* Citation display */}
      <div className="citation-block bg-zinc-50 dark:bg-zinc-800 border-r-4 border-primary p-4 rounded-lg my-4 group">
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
        
        <div className="flex gap-3">
          {/* Citation number */}
          <span className="text-primary font-bold text-lg">[{number}]</span>
          
          {/* Citation content */}
          <div className="flex-1">
            {title ? (
              <cite className="not-italic font-medium text-zinc-900 dark:text-zinc-100">
                {title}
              </cite>
            ) : (
              <span className="text-zinc-400 italic">اضغط لإضافة مرجع</span>
            )}
            
            {author && (
              <span className="text-zinc-600 dark:text-zinc-400"> - {author}</span>
            )}
            
            <span className="text-zinc-500">
              {publisher && `, ${publisher}`}
              {publishDate && ` (${publishDate})`}
              {pageNumbers && `، ص ${pageNumbers}`}
            </span>
            
            {/* Links */}
            {(url || doi) && (
              <div className="flex gap-2 mt-2">
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    عرض المصدر
                  </a>
                )}
                {doi && (
                  <a
                    href={`https://doi.org/${doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm flex items-center gap-1"
                  >
                    <Link className="w-3 h-3" />
                    DOI
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              تعديل المرجع
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Title - Required */}
            <div className="space-y-2">
              <Label htmlFor="title">
                عنوان المرجع <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) => updateFormField('title', e.target.value)}
                placeholder="اسم الكتاب أو المقال..."
              />
            </div>
            
            {/* Author */}
            <div className="space-y-2">
              <Label htmlFor="author">المؤلف</Label>
              <Input
                id="author"
                value={editForm.author}
                onChange={(e) => updateFormField('author', e.target.value)}
                placeholder="اسم المؤلف..."
              />
            </div>
            
            {/* Publisher */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="publisher">الناشر</Label>
                <Input
                  id="publisher"
                  value={editForm.publisher}
                  onChange={(e) => updateFormField('publisher', e.target.value)}
                  placeholder="دار النشر..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publishDate">تاريخ النشر</Label>
                <Input
                  id="publishDate"
                  value={editForm.publishDate}
                  onChange={(e) => updateFormField('publishDate', e.target.value)}
                  placeholder="2024"
                />
              </div>
            </div>
            
            {/* Pages */}
            <div className="space-y-2">
              <Label htmlFor="pageNumbers">أرقام الصفحات</Label>
              <Input
                id="pageNumbers"
                value={editForm.pageNumbers}
                onChange={(e) => updateFormField('pageNumbers', e.target.value)}
                placeholder="مثال: 45-67"
              />
            </div>
            
            {/* URL */}
            <div className="space-y-2">
              <Label htmlFor="url">رابط المصدر</Label>
              <Input
                id="url"
                type="url"
                value={editForm.url}
                onChange={(e) => updateFormField('url', e.target.value)}
                placeholder="https://..."
                dir="ltr"
              />
            </div>
            
            {/* ISBN / DOI */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  value={editForm.isbn}
                  onChange={(e) => updateFormField('isbn', e.target.value)}
                  placeholder="978-..."
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doi">DOI</Label>
                <Input
                  id="doi"
                  value={editForm.doi}
                  onChange={(e) => updateFormField('doi', e.target.value)}
                  placeholder="10.xxxx/..."
                  dir="ltr"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              <X className="w-4 h-4 ml-2" />
              إلغاء
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editForm.title.trim()}>
              <Check className="w-4 h-4 ml-2" />
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </NodeViewWrapper>
  )
}

export default CitationBlockView

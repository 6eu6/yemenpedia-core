'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Save, Send, Loader2, ImageIcon, Lightbulb, FileText, Clock, Trash2,
  CheckCircle2, AlertCircle, FolderOpen
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { TipTapEditor } from '@/components/editor'
import { MediaPicker } from '@/components/media'
import type { TipTapContent } from '@/components/editor/types'
import type { MediaPickerResult } from '@/components/media'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

// ============================================
// Types
// ============================================

interface Category {
  id: string
  name: string
  nameEn?: string
  slug: string
}

interface Governorate {
  id: string
  name: string
  nameEn?: string
}

// ============================================
// Arabic Slug Generator
// ============================================

function generateSlug(title: string): string {
  const slug = title
    .trim()
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100)
  
  const hasEnoughEnglish = /[a-zA-Z]{3,}/.test(title)
  if (!hasEnoughEnglish) {
    return `${slug}-${Date.now().toString(36)}`
  }
  
  return slug.toLowerCase() || `article-${Date.now().toString(36)}`
}

// ============================================
// Content Validation Helper
// ============================================

function checkHasRealContent(content: TipTapContent | null): boolean {
  if (!content || !content.content || content.content.length === 0) {
    return false
  }
  
  return content.content.some(node => {
    if (node.type === 'paragraph' && node.content) {
      return node.content.some(child => child.text && child.text.trim().length > 0)
    }
    if (['imageBlock', 'videoBlock', 'mapBlock', 'citationBlock', 'heading', 'blockquote'].includes(node.type)) {
      return true
    }
    return false
  })
}

// ============================================
// Main Component
// ============================================

export default function WriteArticlePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const t = useTranslations('articleEditor')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  
  const editId = searchParams.get('edit')
  const isRTL = locale === 'ar'
  
  // State
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isFetching, setIsFetching] = useState(!!editId)
  const [categories, setCategories] = useState<Category[]>([])
  const [governorates, setGovernorates] = useState<Governorate[]>([])
  const [editorContent, setEditorContent] = useState<TipTapContent | null>(null)
  const [editorHtml, setEditorHtml] = useState('')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [draftId, setDraftId] = useState<string | null>(editId)
  
  // Media picker state
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [featuredImage, setFeaturedImage] = useState<string | null>(null)
  const [featuredImageAlt, setFeaturedImageAlt] = useState<string | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    governorateId: '',
    summary: '',
    tags: '',
    metaTitle: '',
    metaDescription: '',
    keywords: '',
  })

  // ============================================
  // Computed Values (MUST be before any function that uses them)
  // ============================================
  
  const wordCount = useMemo(() => {
    const text = editorHtml.replace(/<[^>]*>/g, '')
    return text.split(/\s+/).filter(Boolean).length
  }, [editorHtml])
  
  const readTime = Math.max(1, Math.ceil(wordCount / 200))
  
  const hasRealContent = useMemo(() => {
    return checkHasRealContent(editorContent)
  }, [editorContent])
  
  const canSubmit = useMemo(() => {
    return !!(
      formData.title.trim() &&
      formData.categoryId &&
      hasRealContent &&
      user
    )
  }, [formData.title, formData.categoryId, hasRealContent, user])

  // ============================================
  // Redirect if not authenticated
  // ============================================
  
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [authLoading, isAuthenticated, router])

  // ============================================
  // Initial Data Fetch
  // ============================================
  
  useEffect(() => {
    if (!isAuthenticated) return

    Promise.all([
      fetch('/api/v1/categories').then(res => res.json()),
      fetch('/api/v1/governorates').then(res => res.json()).catch(() => ({ governorates: [] }))
    ])
      .then(([catData, govData]) => {
        if (catData.categories) {
          setCategories(catData.categories)
        }
        if (govData.governorates) {
          setGovernorates(govData.governorates)
        }
      })
      .catch(console.error)
  }, [isAuthenticated])

  // ============================================
  // Fetch Draft for Editing
  // ============================================
  
  useEffect(() => {
    if (!editId || !user) return

    const fetchDraft = async () => {
      setIsFetching(true)
      try {
        const res = await fetch(`/api/articles/${editId}`)
        if (res.ok) {
          const draft = await res.json()
          
          if (draft.article) {
            const article = draft.article
            setFormData({
              title: article.title || '',
              categoryId: article.categoryId || '',
              governorateId: article.governorateId || '',
              summary: article.excerpt || '',
              tags: article.tags || '',
              metaTitle: article.metaTitle || '',
              metaDescription: article.metaDescription || '',
              keywords: article.keywords || '',
            })
            
            if (article.content) {
              setEditorContent(article.content)
            }
            
            if (article.featuredImage) {
              setFeaturedImage(article.featuredImage)
              setFeaturedImageAlt(article.featuredImageAlt || null)
            }
            
            setDraftId(article.id)
            if (article.updatedAt) {
              setLastSaved(new Date(article.updatedAt))
            }
          }
        } else {
          toast({ 
            variant: 'destructive', 
            title: tCommon('error'), 
            description: isRTL ? 'المسودة غير موجودة' : 'Draft not found' 
          })
          router.push('/dashboard/articles')
        }
      } catch (error) {
        console.error('Error fetching draft:', error)
        toast({ 
          variant: 'destructive', 
          title: tCommon('error') 
        })
      } finally {
        setIsFetching(false)
      }
    }

    fetchDraft()
  }, [editId, user, router, toast, tCommon, isRTL])

  // ============================================
  // Manual Save to Database
  // ============================================
  
  const handleSaveDraft = useCallback(async () => {
    if (!user) {
      toast({ 
        variant: 'destructive', 
        title: tCommon('error'), 
        description: isRTL ? 'يجب تسجيل الدخول' : 'Please login' 
      })
      return
    }
    
    setIsSaving(true)
    
    try {
      const payload: Record<string, any> = {
        authorId: user.id,
        status: 'DRAFT',
      }
      
      payload.title = formData.title.trim() || (isRTL ? 'مسودة بدون عنوان' : 'Untitled Draft')
      
      if (draftId) payload.articleId = draftId
      if (formData.summary.trim()) payload.excerpt = formData.summary.trim()
      if (editorContent) payload.content = editorContent
      if (formData.categoryId) payload.categoryId = formData.categoryId
      if (formData.governorateId) payload.governorateId = formData.governorateId
      if (formData.tags.trim()) payload.tags = formData.tags.trim()
      if (featuredImage) payload.featuredImage = featuredImage
      if (featuredImageAlt) payload.featuredImageAlt = featuredImageAlt
      if (formData.metaTitle.trim()) payload.metaTitle = formData.metaTitle.trim()
      if (formData.metaDescription.trim()) payload.metaDescription = formData.metaDescription.trim()
      if (formData.keywords.trim()) payload.keywords = formData.keywords.trim()
      
      let response
      if (draftId) {
        response = await fetch('/api/articles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        payload.slug = generateSlug(payload.title)
        response = await fetch('/api/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      const data = await response.json()
      
      if (response.ok) {
        if (!draftId && data.article?.id) {
          setDraftId(data.article.id)
          window.history.replaceState({}, '', `?edit=${data.article.id}`)
        }
        setLastSaved(new Date())
        toast({ title: t('draftSaved') })
      } else {
        toast({ 
          variant: 'destructive', 
          title: tCommon('error'), 
          description: data.error || (isRTL ? 'فشل الحفظ' : 'Failed to save')
        })
      }
    } catch (error) {
      console.error('Save draft error:', error)
      toast({ 
        variant: 'destructive', 
        title: tCommon('error'),
        description: isRTL ? 'حدث خطأ أثناء الحفظ' : 'An error occurred while saving'
      })
    } finally {
      setIsSaving(false)
    }
  }, [user, draftId, formData, editorContent, featuredImage, featuredImageAlt, toast, t, tCommon, isRTL])

  // ============================================
  // Editor Handlers
  // ============================================
  
  const handleContentChange = useCallback((content: TipTapContent, html: string) => {
    setEditorContent(content)
    setEditorHtml(html)
  }, [])

  const handleFeaturedImageSelect = useCallback((result: MediaPickerResult) => {
    setFeaturedImage(result.url)
    setFeaturedImageAlt(result.alt || null)
  }, [])

  const handleRemoveFeaturedImage = useCallback(() => {
    setFeaturedImage(null)
    setFeaturedImageAlt(null)
  }, [])

  // ============================================
  // Submit for Review
  // ============================================
  
  const handleSubmit = useCallback(async () => {
    // Validation
    if (!formData.title.trim()) {
      toast({ 
        variant: 'destructive', 
        title: tCommon('error'), 
        description: isRTL ? 'العنوان مطلوب' : 'Title is required' 
      })
      return
    }
    
    if (!formData.categoryId) {
      toast({ 
        variant: 'destructive', 
        title: tCommon('error'), 
        description: isRTL ? 'يجب اختيار القسم' : 'Category is required' 
      })
      return
    }
    
    if (!checkHasRealContent(editorContent)) {
      toast({ 
        variant: 'destructive', 
        title: tCommon('error'), 
        description: isRTL ? 'المحتوى مطلوب' : 'Content is required' 
      })
      return
    }

    if (!user) {
      toast({ 
        variant: 'destructive', 
        title: tCommon('error'), 
        description: isRTL ? 'يجب تسجيل الدخول' : 'Please login' 
      })
      return
    }

    setIsLoading(true)
    
    try {
      const payload: Record<string, any> = {
        authorId: user.id,
        status: 'PENDING',
        title: formData.title.trim(),
        slug: generateSlug(formData.title),
        categoryId: formData.categoryId,
        content: editorContent,
      }
      
      if (draftId) payload.articleId = draftId
      if (formData.summary.trim()) payload.excerpt = formData.summary.trim()
      if (formData.governorateId) payload.governorateId = formData.governorateId
      if (formData.tags.trim()) payload.tags = formData.tags.trim()
      if (featuredImage) payload.featuredImage = featuredImage
      if (featuredImageAlt) payload.featuredImageAlt = featuredImageAlt
      if (formData.metaTitle.trim()) payload.metaTitle = formData.metaTitle.trim()
      if (formData.metaDescription.trim()) payload.metaDescription = formData.metaDescription.trim()
      if (formData.keywords.trim()) payload.keywords = formData.keywords.trim()
      
      let response
      if (draftId) {
        response = await fetch('/api/articles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        response = await fetch('/api/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      if (response.ok) {
        toast({ 
          title: t('published'),
          description: isRTL ? 'تم إرسال المقال للمراجعة' : 'Article submitted for review'
        })
        router.push('/dashboard/articles')
      } else {
        const data = await response.json()
        toast({ 
          variant: 'destructive', 
          title: tCommon('error'), 
          description: data.error || (isRTL ? 'فشل الإرسال' : 'Failed to submit')
        })
      }
    } catch {
      toast({ variant: 'destructive', title: tCommon('error') })
    } finally {
      setIsLoading(false)
    }
  }, [formData, editorContent, featuredImage, featuredImageAlt, user, draftId, toast, t, tCommon, isRTL, router])

  // ============================================
  // Loading States
  // ============================================
  
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
      </div>
    )
  }
  
  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
      </div>
    )
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {editId ? t('editTitle') : t('title')}
          </h1>
          <p className="text-zinc-500 mt-1">
            {isRTL ? 'اكتب مقالاً جديداً للموسوعة' : 'Write a new article for the encyclopedia'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {lastSaved && (
            <span className="text-sm text-zinc-500">
              {isRTL ? `آخر حفظ: ${lastSaved.toLocaleTimeString('ar')}` : `Last saved: ${lastSaved.toLocaleTimeString()}`}
            </span>
          )}
          
          <Button 
            variant="outline" 
            onClick={handleSaveDraft} 
            disabled={isSaving}
            className="focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {isSaving ? (
              <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
            ) : (
              <Save className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
            )}
            {t('saveDraft')}
          </Button>
          
          <Button 
            className="bg-zinc-900 hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500" 
            onClick={handleSubmit} 
            disabled={isLoading || !canSubmit}
          >
            {isLoading ? (
              <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
            ) : (
              <Send className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
            )}
            {t('submitForReview')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <Label htmlFor="title" className="text-lg font-medium">
                {t('articleTitle')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('articleTitlePlaceholder')}
                className="mt-2 text-lg focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </CardContent>
          </Card>

          {/* Category & Governorate */}
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    {t('category')} <span className="text-destructive">*</span>
                  </Label>
                  <Select 
                    value={formData.categoryId} 
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger className="w-full h-12 text-base focus-visible:ring-2 focus-visible:ring-blue-500">
                      <SelectValue placeholder={t('selectCategory')} />
                    </SelectTrigger>
                    <SelectContent 
                      className="max-h-80"
                      position="popper"
                      sideOffset={4}
                    >
                      <div className="p-1">
                        {categories.length === 0 ? (
                          <div className="p-4 text-center text-zinc-500">
                            {isRTL ? 'لا توجد تصنيفات' : 'No categories available'}
                          </div>
                        ) : (
                          categories.map((cat) => (
                            <SelectItem 
                              key={cat.id} 
                              value={cat.id}
                              className="py-3 text-base cursor-pointer rounded-lg focus:bg-zinc-100 dark:focus:bg-zinc-800"
                            >
                              {isRTL ? cat.name : (cat.nameEn || cat.name)}
                            </SelectItem>
                          ))
                        )}
                      </div>
                    </SelectContent>
                  </Select>
                </div>
                
                {governorates.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-base font-medium">
                      {isRTL ? 'المحافظة' : 'Governorate'}
                    </Label>
                    <Select 
                      value={formData.governorateId} 
                      onValueChange={(value) => setFormData({ ...formData, governorateId: value })}
                    >
                      <SelectTrigger className="w-full h-12 text-base focus-visible:ring-2 focus-visible:ring-blue-500">
                        <SelectValue placeholder={isRTL ? 'اختر المحافظة' : 'Select governorate'} />
                      </SelectTrigger>
                      <SelectContent 
                        className="max-h-80"
                        position="popper"
                        sideOffset={4}
                      >
                        <div className="p-1">
                          {governorates.map((gov) => (
                            <SelectItem 
                              key={gov.id} 
                              value={gov.id}
                              className="py-3 text-base cursor-pointer rounded-lg focus:bg-zinc-100 dark:focus:bg-zinc-800"
                            >
                              {isRTL ? gov.name : (gov.nameEn || gov.name)}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* TipTap Editor */}
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <Label className="text-base font-medium mb-2 block">
                {isRTL ? 'المحتوى' : 'Content'}
              </Label>
              <TipTapEditor
                content={editorContent}
                placeholder={isRTL ? 'ابدأ الكتابة هنا...' : 'Start writing here...'}
                onContentChange={handleContentChange}
                articleSlug={formData.title.toLowerCase().replace(/\s+/g, '-').substring(0, 50) || 'article'}
                articleId={draftId || undefined}
              />
              <div className="flex items-center gap-4 mt-4 text-sm text-zinc-500">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {t('wordCount')}: {wordCount}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {t('readTime')}: ~{readTime} {t('minutes')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <Label className="text-base font-medium">{t('summary')}</Label>
              <Textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder={t('summaryPlaceholder')}
                className="mt-2 focus-visible:ring-2 focus-visible:ring-blue-500"
                rows={3}
                maxLength={300}
              />
              <p className="text-xs text-zinc-400 mt-1">
                {formData.summary.length}/300
              </p>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <Label className="text-base font-medium">{t('tags')}</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder={t('tagsPlaceholder')}
                className="mt-2 focus-visible:ring-2 focus-visible:ring-blue-500"
              />
              <p className="text-xs text-zinc-400 mt-1">
                {isRTL ? 'افصل بين الوسوم بفواصل' : 'Separate tags with commas'}
              </p>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                {isRTL ? 'إعدادات SEO' : 'SEO Settings'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{isRTL ? 'عنوان SEO' : 'SEO Title'}</Label>
                <Input
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  placeholder={isRTL ? 'عنوان للبحث (اختياري)' : 'SEO title (optional)'}
                  className="mt-1"
                  maxLength={60}
                />
                <p className="text-xs text-zinc-400 mt-1">{formData.metaTitle.length}/60</p>
              </div>
              
              <div>
                <Label>{isRTL ? 'وصف SEO' : 'SEO Description'}</Label>
                <Textarea
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  placeholder={isRTL ? 'وصف للمحركات البحث (اختياري)' : 'SEO description (optional)'}
                  className="mt-1"
                  rows={2}
                  maxLength={160}
                />
                <p className="text-xs text-zinc-400 mt-1">{formData.metaDescription.length}/160</p>
              </div>
              
              <div>
                <Label>{isRTL ? 'الكلمات المفتاحية' : 'Keywords'}</Label>
                <Input
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder={isRTL ? 'كلمات مفتاحية مفصولة بفواصل' : 'Keywords separated by commas'}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Featured Image */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                {t('featuredImage')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {featuredImage ? (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden border">
                    <img
                      src={featuredImage}
                      alt={featuredImageAlt || ''}
                      className="w-full h-48 object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 p-0"
                      onClick={handleRemoveFeaturedImage}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowMediaPicker(true)}
                  >
                    <ImageIcon className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                    {isRTL ? 'تغيير الصورة' : 'Change Image'}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-32 flex flex-col gap-2"
                  onClick={() => setShowMediaPicker(true)}
                >
                  <ImageIcon className="h-8 w-8 text-zinc-400" />
                  <span>{t('uploadImage')}</span>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Requirements Checklist */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                {isRTL ? 'متطلبات النشر' : 'Publish Requirements'}
                {canSubmit && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                  {formData.title.trim() ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-zinc-300 flex-shrink-0" />
                  )}
                  <span className={formData.title.trim() ? 'text-zinc-700 font-medium' : 'text-zinc-400'}>
                    {isRTL ? 'العنوان' : 'Title'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                  {formData.categoryId ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-zinc-300 flex-shrink-0" />
                  )}
                  <span className={formData.categoryId ? 'text-zinc-700 font-medium' : 'text-zinc-400'}>
                    {isRTL ? 'القسم' : 'Category'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                  {hasRealContent ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-zinc-300 flex-shrink-0" />
                  )}
                  <span className={hasRealContent ? 'text-zinc-700 font-medium' : 'text-zinc-400'}>
                    {isRTL ? 'المحتوى' : 'Content'}
                  </span>
                </div>
              </div>
              
              {!canSubmit && (
                <p className="text-xs text-zinc-400 mt-4 pt-3 border-t">
                  {isRTL 
                    ? 'أكمل المتطلبات أعلاه للتمكن من إرسال المقال للمراجعة'
                    : 'Complete the requirements above to submit for review'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Writing Tips */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                {t('writingTips')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full mt-2 shrink-0" />
                  {t('tip1')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full mt-2 shrink-0" />
                  {t('tip2')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full mt-2 shrink-0" />
                  {t('tip3')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full mt-2 shrink-0" />
                  {t('tip4')}
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{isRTL ? 'إحصائيات' : 'Stats'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                <span className="text-sm text-zinc-500">{t('wordCount')}</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{wordCount}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                <span className="text-sm text-zinc-500">{t('readTime')}</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">~{readTime} {t('minutes')}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                <span className="text-sm text-zinc-500">{isRTL ? 'الحالة' : 'Status'}</span>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  draftId ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                )}>
                  {draftId ? (isRTL ? 'مسودة' : 'Draft') : (isRTL ? 'جديد' : 'New')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Media Picker Dialog */}
      <MediaPicker
        open={showMediaPicker}
        onOpenChange={setShowMediaPicker}
        onSelect={handleFeaturedImageSelect}
        type="image"
        folder={formData.title.toLowerCase().replace(/\s+/g, '-').substring(0, 50) || 'article'}
        locale={locale}
      />
    </div>
  )
}

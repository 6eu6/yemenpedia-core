'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import { useTranslations, useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Check, X, Eye, Clock, User, FileText, Loader2, ArrowRight, ArrowLeft
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { useAuth } from '@/contexts/AuthContext'

interface ArticleForReview {
  id: string
  title: string
  content: string
  summary?: string
  status: string
  createdAt: string
  author: { name: string; username: string }
  category?: { name: string }
}

export default function ReviewPage() {
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations('review')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [articles, setArticles] = useState<ArticleForReview[]>([])
  const [selectedArticle, setSelectedArticle] = useState<ArticleForReview | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  const isRTL = locale === 'ar'
  const dateLocale = locale === 'ar' ? ar : enUS

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (user && !['ADMIN', 'SUPERVISOR', 'VERIFIER'].includes(user.role || '')) {
      router.push('/dashboard')
      return
    }
    
    if (isAuthenticated) {
      fetchArticles()
    }
  }, [user, isAuthenticated, router])

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/articles/review')
      if (res.ok) {
        const data = await res.json()
        setArticles(data.articles || [])
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!selectedArticle) return

    setIsProcessing(true)
    try {
      const res = await fetch('/api/articles/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: selectedArticle.id,
          action,
          notes: reviewNotes
        })
      })

      if (res.ok) {
        toast({ 
          title: action === 'approve' ? t('articleApproved') : t('articleRejected') 
        })
        setArticles(articles.filter(a => a.id !== selectedArticle.id))
        setSelectedArticle(null)
        setReviewNotes('')
      } else {
        toast({ variant: 'destructive', title: tCommon('error') })
      }
    } catch {
      toast({ variant: 'destructive', title: tCommon('error') })
    } finally {
      setIsProcessing(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-zinc-500 mt-1">
          {isRTL ? 'راجع المقالات المقدمة للنشر' : 'Review submitted articles for publication'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Articles List */}
        <Card className="lg:col-span-1 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">{t('pending')} ({articles.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {articles.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-zinc-300" />
                <p>{t('noArticles')}</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-700">
                {articles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    className={`w-full p-4 text-right hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      selectedArticle?.id === article.id ? 'bg-zinc-100 dark:bg-zinc-700' : ''
                    }`}
                  >
                    <h3 className="font-medium truncate">{article.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-zinc-500">
                      <User className="h-3 w-3" />
                      {article.author.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true, locale: dateLocale })}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Article Review */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          {selectedArticle ? (
            <>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedArticle.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {isRTL ? 'بواسطة:' : 'By:'} {selectedArticle.author.name} (@{selectedArticle.author.username})
                    </CardDescription>
                  </div>
                  {selectedArticle.category && (
                    <Badge variant="outline">{selectedArticle.category.name}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedArticle.summary && (
                  <div>
                    <Label className="text-lg font-medium">{isRTL ? 'الملخص' : 'Summary'}</Label>
                    <p className="mt-2 text-zinc-600 dark:text-zinc-400">{selectedArticle.summary}</p>
                  </div>
                )}
                
                <div>
                  <Label className="text-lg font-medium">{isRTL ? 'المحتوى' : 'Content'}</Label>
                  <div className="mt-2 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg max-h-[400px] overflow-y-auto">
                    <p className="whitespace-pre-wrap">{selectedArticle.content}</p>
                  </div>
                </div>

                <div>
                  <Label>{t('reviewNotes')}</Label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={t('reviewNotesPlaceholder')}
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700 focus-visible:ring-2 focus-visible:ring-blue-500"
                    onClick={() => handleReview('approve')}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                    ) : (
                      <Check className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                    )}
                    {t('approve')}
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1 focus-visible:ring-2 focus-visible:ring-blue-500"
                    onClick={() => handleReview('reject')}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                    ) : (
                      <X className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                    )}
                    {t('reject')}
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center min-h-[400px] text-zinc-500">
              <div className="text-center">
                <Eye className="h-16 w-16 mx-auto mb-4 text-zinc-300" />
                <p>{isRTL ? 'اختر مقالاً لمراجعته' : 'Select an article to review'}</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}

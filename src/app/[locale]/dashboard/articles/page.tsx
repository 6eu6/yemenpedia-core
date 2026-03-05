'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import { Link } from '@/i18n/routing'
import { useTranslations, useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, Eye, Heart, Clock, Loader2, PenTool, Plus, 
  Edit, Trash2, Send
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

interface Article {
  id: string
  title: string
  slug: string
  status: string
  viewCount: number
  likeCount: number
  createdAt: string
  updatedAt: string
  featuredImage?: string
  category?: { name: string }
}

export default function MyArticlesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations('dashboard')
  const tArticles = useTranslations('articles')
  const locale = useLocale()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  const isRTL = locale === 'ar'
  const dateLocale = locale === 'ar' ? ar : enUS

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (user) {
      fetchArticles()
    }
  }, [user])

  const fetchArticles = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      // جلب كل مقالات المستخدم
      const res = await fetch(`/api/articles?authorId=${user?.id}&limit=100`)
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

  // حذف مسودة
  const handleDeleteDraft = async (articleId: string) => {
    if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذه المسودة؟' : 'Are you sure you want to delete this draft?')) {
      return
    }

    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorId: user?.id })
      })

      if (res.ok) {
        toast({ title: isRTL ? 'تم حذف المسودة' : 'Draft deleted' })
        setArticles(prev => prev.filter(a => a.id !== articleId))
      } else {
        const data = await res.json()
        toast({ variant: 'destructive', title: data.error || tArticles('error') })
      }
    } catch (error) {
      toast({ variant: 'destructive', title: tArticles('error') })
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return isRTL ? 'منشور' : 'Published'
      case 'PENDING':
        return isRTL ? 'قيد المراجعة' : 'Pending Review'
      case 'REJECTED':
        return isRTL ? 'مرفوض' : 'Rejected'
      case 'DRAFT':
        return isRTL ? 'مسودة' : 'Draft'
      default:
        return status
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'default'
      case 'PENDING':
        return 'secondary'
      case 'REJECTED':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // تصفية المقالات حسب التبويب
  const filteredArticles = articles.filter(article => {
    if (activeTab === 'all') return true
    if (activeTab === 'drafts') return article.status === 'DRAFT'
    if (activeTab === 'pending') return article.status === 'PENDING'
    if (activeTab === 'published') return article.status === 'APPROVED'
    return true
  })

  // إحصائيات
  const draftsCount = articles.filter(a => a.status === 'DRAFT').length
  const pendingCount = articles.filter(a => a.status === 'PENDING').length
  const publishedCount = articles.filter(a => a.status === 'APPROVED').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('myArticles')}</h1>
          <p className="text-zinc-500 mt-1">
            {isRTL ? 'قائمة بجميع مقالاتك ومسوداتك' : 'List of all your articles and drafts'}
          </p>
        </div>
        <Link href="/dashboard/write">
          <Button className="bg-zinc-900 hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500">
            <Plus className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
            {t('writeArticle')}
          </Button>
        </Link>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-zinc-900">{articles.length}</div>
            <div className="text-sm text-zinc-500">{isRTL ? 'الكل' : 'All'}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all" onClick={() => setActiveTab('drafts')}>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-yellow-600">{draftsCount}</div>
            <div className="text-sm text-zinc-500">{isRTL ? 'مسودات' : 'Drafts'}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all" onClick={() => setActiveTab('pending')}>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
            <div className="text-sm text-zinc-500">{isRTL ? 'قيد المراجعة' : 'Pending'}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all" onClick={() => setActiveTab('published')}>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-green-600">{publishedCount}</div>
            <div className="text-sm text-zinc-500">{isRTL ? 'منشورة' : 'Published'}</div>
          </CardContent>
        </Card>
      </div>

      {/* تبويبات المقالات */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="all">{isRTL ? 'الكل' : 'All'}</TabsTrigger>
          <TabsTrigger value="drafts">{isRTL ? 'المسودات' : 'Drafts'}</TabsTrigger>
          <TabsTrigger value="pending">{isRTL ? 'قيد المراجعة' : 'Pending'}</TabsTrigger>
          <TabsTrigger value="published">{isRTL ? 'المنشورة' : 'Published'}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-zinc-300" />
                  <p className="text-lg">{tArticles('noArticles')}</p>
                  {activeTab === 'drafts' && (
                    <Link href="/dashboard/write">
                      <Button className="mt-4 bg-zinc-900 hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500">
                        <PenTool className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                        {t('writeArticle')}
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredArticles.map((article) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {/* Featured Image Thumbnail */}
                        {article.featuredImage ? (
                          <img
                            src={article.featuredImage}
                            alt=""
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-6 w-6 text-zinc-400" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-lg truncate">{article.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-zinc-500">
                            {article.category && (
                              <span className="bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full text-xs">
                                {article.category.name}
                              </span>
                            )}
                            <Badge variant={getStatusVariant(article.status) as any}>
                              {getStatusText(article.status)}
                            </Badge>
                            {article.status === 'APPROVED' && (
                              <>
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {article.viewCount}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  {article.likeCount}
                                </span>
                              </>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(article.updatedAt || article.createdAt), { addSuffix: true, locale: dateLocale })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* أزرار الإجراءات */}
                      <div className="flex items-center gap-2">
                        {article.status === 'DRAFT' && (
                          <>
                            <Link href={`/dashboard/write?edit=${article.id}`}>
                              <Button size="sm" variant="outline" className="focus-visible:ring-2 focus-visible:ring-blue-500">
                                <Edit className="h-4 w-4" />
                                <span className="hidden md:inline mr-1">{isRTL ? 'متابعة' : 'Continue'}</span>
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-destructive hover:text-destructive focus-visible:ring-2 focus-visible:ring-blue-500"
                              onClick={() => handleDeleteDraft(article.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {article.status === 'PENDING' && (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 ml-1" />
                            {isRTL ? 'في الانتظار' : 'Waiting'}
                          </Badge>
                        )}
                        {article.status === 'APPROVED' && (
                          <Link href={`/article/${article.slug}`}>
                            <Button size="sm" variant="outline" className="focus-visible:ring-2 focus-visible:ring-blue-500">
                              <Eye className="h-4 w-4" />
                              <span className="hidden md:inline mr-1">{isRTL ? 'عرض' : 'View'}</span>
                            </Button>
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

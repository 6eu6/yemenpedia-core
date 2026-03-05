'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import { Link } from '@/i18n/routing'
import { useTranslations, useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Eye, Heart, Star, PenTool, TrendingUp, Clock, Loader2, LogOut } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

interface Article {
  id: string
  title: string
  status: string
  viewCount: number
  likeCount: number
  createdAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [stats, setStats] = useState({ count: 0, views: 0, likes: 0 })
  const [isLoading, setIsLoading] = useState(true)

  const isRTL = locale === 'ar'
  const dateLocale = locale === 'ar' ? ar : enUS

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (user) {
      fetchData(user.id)
    }
  }, [user])

  const fetchData = async (userId: string) => {
    try {
      // Fetch stats from API
      const res = await fetch(`/api/user/stats?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setArticles(data.articles || [])
        setStats({
          count: data.stats?.articleCount || 0,
          views: data.stats?.viewCount || 0,
          likes: data.stats?.likeCount || 0
        })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return isRTL ? 'منشور' : 'Published'
      case 'PENDING':
        return isRTL ? 'قيد المراجعة' : 'Pending Review'
      case 'REJECTED':
        return isRTL ? 'مرفوض' : 'Rejected'
      default:
        return isRTL ? 'مسودة' : 'Draft'
    }
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
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

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {t('welcome', { name: user.name })}
          </h1>
          <p className="text-zinc-500 mt-1">
            {isRTL ? 'إليك نظرة عامة على نشاطك في يمنبيديا' : 'Here\'s an overview of your activity in Yemenpedia'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/write">
            <Button className="bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-blue-500">
              <PenTool className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {t('writeArticle')}
            </Button>
          </Link>
          <Button variant="outline" onClick={handleLogout} className="border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500">
            <LogOut className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
            {t('logout')}
          </Button>
        </div>
      </div>

      {/* Stats Cards - GOVERNANCE: Unified Zinc styling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">{t('myArticles')}</p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{stats.count}</p>
              </div>
              <div className="h-12 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">{t('totalViews')}</p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{stats.views.toLocaleString(locale === 'ar' ? 'ar-YE' : 'en-US')}</p>
              </div>
              <div className="h-12 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">{isRTL ? 'النقاط' : 'Points'}</p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{(user as any).points || 0}</p>
              </div>
              <div className="h-12 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">{isRTL ? 'الإعجابات' : 'Likes'}</p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{stats.likes.toLocaleString(locale === 'ar' ? 'ar-YE' : 'en-US')}</p>
              </div>
              <div className="h-12 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Articles */}
        <Card className="lg:col-span-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <CardHeader>
            <CardTitle className="text-zinc-900 dark:text-zinc-50">{isRTL ? 'مقالاتي الأخيرة' : 'My Recent Articles'}</CardTitle>
            <CardDescription className="text-zinc-500">{isRTL ? 'آخر المقالات قمت بكتابتها' : 'Your most recent articles'}</CardDescription>
          </CardHeader>
          <CardContent>
            {articles.length === 0 ? (
              // GOVERNANCE: Empty State - No fake data
              <div className="text-center py-8 text-zinc-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
                <p className="text-zinc-600 dark:text-zinc-400">{isRTL ? 'لم تكتب أي مقالات بعد' : 'You haven\'t written any articles yet'}</p>
                <Link href="/dashboard/write">
                  <Button className="mt-4 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-blue-500">
                    {isRTL ? 'ابدأ بكتابة أول مقال' : 'Start writing your first article'}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-700"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-zinc-900 dark:text-zinc-50">{article.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {article.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {article.likeCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true, locale: dateLocale })}
                        </span>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(article.status)}>
                      {getStatusText(article.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-900 dark:text-zinc-50">{t('quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/write" className="block">
                <Button variant="outline" className="w-full justify-start border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500">
                  <PenTool className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                  {t('writeArticle')}
                </Button>
              </Link>
              <Link href="/dashboard/categories/request" className="block">
                <Button variant="outline" className="w-full justify-start border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500">
                  <TrendingUp className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                  {isRTL ? 'طلب قسم جديد' : 'Request new category'}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* User Info */}
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-zinc-600 dark:text-zinc-400">
                    {user.name?.charAt(0) || (isRTL ? 'ي' : 'Y')}
                  </span>
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{user.name}</h3>
                <p className="text-sm text-zinc-500">{user.email}</p>
                <Badge variant="secondary" className="mt-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">{user.role}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

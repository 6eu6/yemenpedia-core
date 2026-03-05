'use client'

import { motion } from 'framer-motion'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { useState, useEffect } from 'react'
import { Calendar, Clock, ArrowLeft, Eye, FileText, PenTool } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// GOVERNANCE: Real article interface
interface Article {
  id: string
  title: string
  excerpt: string
  category: { name: string; slug: string }
  featuredImage?: string
  createdAt: string
  readTime: number
  viewCount: number
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
}

export function LatestArticles() {
  const locale = useLocale()
  const t = useTranslations()
  const isRTL = locale === 'ar'
  const dir = isRTL ? 'rtl' : 'ltr'
  
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // GOVERNANCE: Fetch real articles from database
  useEffect(() => {
    async function fetchArticles() {
      try {
        const res = await fetch('/api/v1/articles/latest?limit=6')
        if (res.ok) {
          const data = await res.json()
          setArticles(data.articles || [])
        } else {
          // GOVERNANCE: Show empty state if API fails
          setArticles([])
        }
      } catch {
        setArticles([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchArticles()
  }, [])

  // GOVERNANCE: Empty state check
  const isEmptyState = !isLoading && articles.length === 0

  return (
    <section className="py-20 bg-white dark:bg-zinc-800">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-50"
            >
              {t('articles.title')}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-zinc-600 dark:text-zinc-400 mt-2"
            >
              {t('articles.subtitle')}
            </motion.p>
          </div>
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors font-medium focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {t('common.viewAll')}
            <ArrowLeft className={`h-4 w-4 ${dir === 'rtl' ? '' : 'rotate-180'}`} />
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden animate-pulse">
                <div className="h-56 bg-zinc-200 dark:bg-zinc-800" />
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* GOVERNANCE: Empty State - No hardcoded articles */}
        {isEmptyState && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-zinc-400 dark:text-zinc-500" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                {isRTL ? 'لا توجد مقالات بعد' : 'No Articles Yet'}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                {isRTL 
                  ? 'كن أول من يكتب مقالاً في هذه الموسوعة' 
                  : 'Be the first to write an article in this encyclopedia'}
              </p>
              <Link href="/auth/register">
                <Button className="bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500">
                  <PenTool className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                  {isRTL ? 'ابدأ الكتابة' : 'Start Writing'}
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Articles Grid - REAL DATA ONLY */}
        {!isLoading && articles.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {articles.map((article) => (
              <motion.div key={article.id} variants={itemVariants}>
                <Link href={`/article/${article.id}`}>
                  <Card className="group h-full overflow-hidden hover:shadow-lg transition-all duration-300 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600">
                    {/* Image */}
                    <div className="relative h-56 overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                      {article.featuredImage ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                          style={{ backgroundImage: `url(${article.featuredImage})` }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FileText className="h-12 w-12 text-zinc-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      
                      {/* Category Badge */}
                      <Badge
                        className="absolute bottom-4 right-4 bg-zinc-800/80 text-zinc-100 font-medium backdrop-blur-sm"
                      >
                        {article.category?.name || (isRTL ? 'عام' : 'General')}
                      </Badge>
                    </div>

                    <CardContent className="p-6">
                      {/* Title */}
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3 line-clamp-2 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors leading-relaxed">
                        {article.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2 leading-relaxed">
                        {article.excerpt}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {new Date(article.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-YE' : 'en-US')}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {article.readTime} {isRTL ? 'د' : 'min'}
                          </span>
                        </div>
                        <span className="flex items-center gap-1.5">
                          <Eye className="h-4 w-4" />
                          {article.viewCount.toLocaleString(locale === 'ar' ? 'ar-YE' : 'en-US')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  )
}

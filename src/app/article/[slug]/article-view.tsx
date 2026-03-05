'use client'

import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, Heart, Bookmark, Share2, Printer, Calendar, User, FolderTree, MapPin, Tag, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import ReactMarkdown from 'react-markdown'

interface ArticleViewProps {
  article: {
    id: string
    title: string
    slug: string
    excerpt: string | null
    content: string
    viewCount: number
    likeCount: number
    bookmarkCount: number
    createdAt: Date
    publishedAt: Date | null
    author: { id: string; name: string | null; image: string | null; bio: string | null }
    category: { id: string; name: string; slug: string }
    governorate: { id: string; name: string; slug: string } | null
    tags: { tag: { id: string; name: string; slug: string } }[]
    sources: { id: string; title: string; url: string | null; author: string | null }[]
  }
}

export function ArticleView({ article }: ArticleViewProps) {
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: article.title,
        url: window.location.href
      })
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Hero */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950 text-white py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-zinc-300 mb-6">
            <Link href="/" className="hover:text-white">الرئيسية</Link>
            <span>/</span>
            <Link href="/categories" className="hover:text-white">الأقسام</Link>
            <span>/</span>
            <Link href={`/category/${article.category.slug}`} className="hover:text-white">
              {article.category.name}
            </Link>
          </div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-bold leading-tight mb-4"
          >
            {article.title}
          </motion.h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-300">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {format(article.publishedAt || article.createdAt, 'dd MMMM yyyy', { locale: ar })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{article.viewCount.toLocaleString('ar-YE')} مشاهدة</span>
            </div>
            <div className="flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              <Link href={`/category/${article.category.slug}`} className="hover:text-white">
                {article.category.name}
              </Link>
            </div>
            {article.governorate && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <Link href={`/governorate/${article.governorate.slug}`} className="hover:text-white">
                  {article.governorate.name}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Actions */}
            <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-zinc-800 rounded-xl shadow-sm">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="focus-visible:ring-2 focus-visible:ring-blue-500">
                  <Heart className="ml-2 h-4 w-4" />
                  {article.likeCount}
                </Button>
                <Button variant="outline" size="sm" className="focus-visible:ring-2 focus-visible:ring-blue-500">
                  <Bookmark className="ml-2 h-4 w-4" />
                  حفظ
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleShare} className="focus-visible:ring-2 focus-visible:ring-blue-500">
                  <Share2 className="ml-2 h-4 w-4" />
                  مشاركة
                </Button>
                <Button variant="ghost" size="sm" onClick={() => window.print()} className="focus-visible:ring-2 focus-visible:ring-blue-500">
                  <Printer className="ml-2 h-4 w-4" />
                  طباعة
                </Button>
              </div>
            </div>

            {/* Article Content */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <article className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-zinc-600">
                  <ReactMarkdown>{article.content}</ReactMarkdown>
                </article>

                {/* Tags */}
                {article.tags.length > 0 && (
                  <div className="mt-8 pt-6 border-t">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag className="h-4 w-4 text-zinc-400" />
                      {article.tags.map(({ tag }) => (
                        <Link key={tag.id} href={`/tag/${tag.slug}`}>
                          <Badge variant="secondary" className="hover:bg-zinc-100">
                            {tag.name}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sources */}
                {article.sources.length > 0 && (
                  <div className="mt-8 pt-6 border-t">
                    <h3 className="font-bold mb-4">المصادر والمراجع</h3>
                    <ul className="space-y-2">
                      {article.sources.map((source) => (
                        <li key={source.id} className="text-sm text-zinc-600">
                          • {source.url ? (
                            <a href={source.url} target="_blank" rel="noopener" className="text-zinc-600 hover:underline">
                              {source.title}
                            </a>
                          ) : (
                            source.title
                          )}
                          {source.author && ` - ${source.author}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Author */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Avatar className="h-20 w-20 mx-auto ring-4 ring-zinc-100">
                  <AvatarImage src={article.author.image || ''} />
                  <AvatarFallback className="bg-zinc-600 text-white text-xl">
                    {article.author.name?.charAt(0) || 'ي'}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-bold mt-4">{article.author.name}</h3>
                <p className="text-sm text-zinc-500 mt-1">{article.author.bio?.substring(0, 100)}</p>
                <Link href={`/user/${article.author.id}`}>
                  <Button variant="outline" className="mt-4 w-full focus-visible:ring-2 focus-visible:ring-blue-500">
                    عرض الملف
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Back Button */}
            <Link href="/">
              <Button variant="ghost" className="w-full focus-visible:ring-2 focus-visible:ring-blue-500">
                <ArrowLeft className="ml-2 h-4 w-4" />
                العودة للرئيسية
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

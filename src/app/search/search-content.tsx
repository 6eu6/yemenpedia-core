'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Search as SearchIcon,
  FileText,
  FolderTree,
  MapPin,
  Loader2,
  ArrowLeft,
  FolderOpen
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useTheme } from 'next-themes'

interface SearchResult {
  articles: Array<{
    id: string
    title: string
    slug: string
    excerpt: string | null
    category: { name: string }
  }>
  categories: Array<{
    id: string
    name: string
    slug: string
    icon: string | null
    articleCount: number
  }>
  governorates: Array<{
    id: string
    name: string
    nameEn: string | null
    capital: string | null
    articleCount: number
  }>
}

export function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentLang, setCurrentLang] = useState('ar')
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    const q = searchParams.get('q')
    if (q && q.length >= 2) {
      setQuery(q)
      performSearch(q)
    }
  }, [searchParams])

  const performSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) return

    setIsLoading(true)
    setHasSearched(true)

    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setResults(data.results)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
      performSearch(query)
    }
  }

  const totalResults = results
    ? (results.articles?.length || 0) + (results.categories?.length || 0) + (results.governorates?.length || 0)
    : 0

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-900" dir={currentLang === 'ar' || currentLang === 'he' ? 'rtl' : 'ltr'}>
      <Header
        isDark={theme === 'dark'}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
      />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Search Form */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">البحث في يمنبيديا</h1>
            <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="ابحث عن مقالات، أقسام، محافظات..."
                  className="pr-10 h-12 text-lg bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus-visible:ring-2 focus-visible:ring-blue-500"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Button type="submit" className="h-12 px-6 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 focus-visible:ring-2 focus-visible:ring-blue-500" disabled={isLoading || query.length < 2}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'بحث'}
              </Button>
            </form>
            {query.length > 0 && query.length < 2 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">أدخل حرفين على الأقل للبحث</p>
            )}
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-600 dark:text-zinc-400" />
            </div>
          ) : hasSearched && results ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-zinc-500 dark:text-zinc-400">
                  {totalResults > 0
                    ? `تم العثور على ${totalResults} نتيجة`
                    : 'لم يتم العثور على نتائج'}
                </p>
                <Link href="/">
                  <Button variant="ghost" size="sm" className="focus-visible:ring-2 focus-visible:ring-blue-500">
                    <ArrowLeft className="ml-2 h-4 w-4" />
                    العودة للرئيسية
                  </Button>
                </Link>
              </div>

              {/* Articles */}
              {results.articles && results.articles.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                    <FileText className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                    المقالات ({results.articles.length})
                  </h2>
                  <div className="space-y-3">
                    {results.articles.map((article, index) => (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link href={`/article/${article.slug}`} className="focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg block">
                          <Card className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:shadow-lg transition-shadow">
                            <CardContent className="pt-4 pb-3">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50">{article.title}</h3>
                                  {article.excerpt && (
                                    <p className="text-zinc-500 dark:text-zinc-400 text-sm line-clamp-2 mt-1">{article.excerpt}</p>
                                  )}
                                  <Badge variant="outline" className="mt-2 border-zinc-200 dark:border-zinc-700">{article.category?.name}</Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories - NO EMOJI per Article II, Section 2.3 */}
              {results.categories && results.categories.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                    <FolderTree className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                    الأقسام ({results.categories.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {results.categories.map((category, index) => (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link href={`/category/${category.slug}`} className="focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg block">
                          <Card className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:shadow-lg transition-shadow">
                            <CardContent className="pt-4 pb-3 text-center">
                              <div className="w-12 h-12 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                                <FolderOpen className="h-6 w-6 text-zinc-500 dark:text-zinc-400" />
                              </div>
                              <h3 className="font-semibold mt-2 text-zinc-900 dark:text-zinc-50">{category.name}</h3>
                              <p className="text-sm text-zinc-500 dark:text-zinc-400">{category.articleCount} مقال</p>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Governorates */}
              {results.governorates && results.governorates.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                    <MapPin className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                    المحافظات ({results.governorates.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {results.governorates.map((gov, index) => (
                      <motion.div
                        key={gov.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link href={`/governorate/${gov.name}`} className="focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg block">
                          <Card className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:shadow-lg transition-shadow">
                            <CardContent className="pt-4 pb-3">
                              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{gov.name}</h3>
                              {gov.capital && (
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">العاصمة: {gov.capital}</p>
                              )}
                              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{gov.articleCount} مقال</p>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {totalResults === 0 && (
                <div className="text-center py-12">
                  <SearchIcon className="h-16 w-16 mx-auto text-zinc-400 dark:text-zinc-600 mb-4" />
                  <p className="text-zinc-500 dark:text-zinc-400 text-lg">لم يتم العثور على نتائج لـ "{query}"</p>
                  <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-2">جرب البحث بكلمات مختلفة</p>
                </div>
              )}
            </>
          ) : (
            !hasSearched && (
              <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                <SearchIcon className="h-16 w-16 mx-auto text-zinc-400 dark:text-zinc-600 mb-4" />
                <p>ابحث عن مقالات، أقسام، أو محافظات يمنية</p>
              </div>
            )
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

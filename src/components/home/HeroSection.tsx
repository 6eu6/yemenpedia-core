'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { ArrowLeft, Search, BookOpen, Users, FileText, PenTool } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RealStats {
  articles: number
  contributors: number
  categories: number
}

export function HeroSection() {
  const locale = useLocale()
  const t = useTranslations()
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState<RealStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Only Arabic is RTL
  const isRTL = locale === 'ar'

  // GOVERNANCE: Fetch real stats from database - NO FAKE NUMBERS
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/v1/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        } else {
          // If API fails, show zeros (GOVERNANCE: Zero Placeholder Policy)
          setStats({ articles: 0, contributors: 0, categories: 0 })
        }
      } catch {
        setStats({ articles: 0, contributors: 0, categories: 0 })
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  // GOVERNANCE: Real data only - show actual DB counts
  const statItems = stats ? [
    { label: t('hero.statArticles'), value: stats.articles, icon: FileText },
    { label: t('hero.statWriters'), value: stats.contributors, icon: Users },
    { label: t('hero.statCategories'), value: stats.categories, icon: BookOpen },
  ] : []

  const popularSearches = locale === 'ar' 
    ? ['تاريخ اليمن', 'صنعاء القديمة', 'جزيرة سقطرى', 'القهوة اليمنية']
    : ['Yemen History', 'Old Sana\'a', 'Socotra Island', 'Yemeni Coffee']

  // GOVERNANCE: Empty state CTA
  const isEmptyState = stats && stats.articles === 0

  return (
    <section className="relative overflow-hidden bg-zinc-950 text-white min-h-[90vh] flex items-center">
      {/* Minimal Background Pattern - GOVERNANCE: No flashy gradients */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-4 leading-tight text-zinc-50">
              {t('hero.title')}
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-zinc-400 font-light tracking-wide mt-4"
            >
              Yemenpedia
            </motion.p>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg md:text-xl text-zinc-500 text-center mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            {t('hero.description')}
          </motion.p>

          {/* Search Bar - Clean Minimal Design */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-3xl mx-auto mb-8"
          >
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-500`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('hero.searchPlaceholder')}
                    className={`w-full py-4 px-12 ${isRTL ? 'pr-12 text-right' : 'pl-12 text-left'} rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  />
                </div>
                <Link href={`/search?q=${encodeURIComponent(searchQuery)}`}>
                  <Button
                    size="lg"
                    className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 rounded-lg px-8 w-full sm:w-auto focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    {t('hero.startSearch')}
                    <ArrowLeft className={`${isRTL ? 'mr-2' : 'ml-2 rotate-180'} h-5 w-5`} />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Popular Searches */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="text-xs text-zinc-600">{t('hero.popularSearches')}</span>
              {popularSearches.slice(0, 4).map((term, index) => (
                <motion.button
                  key={term}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  onClick={() => setSearchQuery(term)}
                  className="text-xs px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 rounded-full text-zinc-400 hover:text-zinc-200 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {term}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 mb-16"
          >
            <Link href="/auth/register">
              <Button
                size="lg"
                className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 rounded-lg px-8 focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <PenTool className={`${isRTL ? 'ml-2' : 'mr-2'} h-5 w-5`} />
                {t('hero.joinAsWriter')}
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                size="lg"
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 rounded-lg px-8 focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {t('common.login')}
              </Button>
            </Link>
          </motion.div>

          {/* Stats - Real Data from Database */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto"
          >
            {isLoading ? (
              // Loading skeletons
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse">
                  <div className="w-12 h-12 rounded-lg bg-zinc-800 mx-auto mb-3" />
                  <div className="h-8 bg-zinc-800 rounded mb-1 w-16 mx-auto" />
                  <div className="h-4 bg-zinc-800 rounded w-20 mx-auto" />
                </div>
              ))
            ) : isEmptyState ? (
              // GOVERNANCE: Empty State - "Be the first to contribute"
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full"
              >
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <PenTool className="h-8 w-8 text-zinc-400" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-100 mb-2">
                    {isRTL ? 'كن أول المساهمين' : 'Be the First Contributor'}
                  </h3>
                  <p className="text-zinc-500 mb-4">
                    {isRTL ? 'الموسوعة فارغة حالياً. انضم إلينا وابدأ بكتابة أول مقال!' : 'The encyclopedia is currently empty. Join us and write the first article!'}
                  </p>
                  <Link href="/auth/register">
                    <Button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500">
                      <PenTool className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                      {isRTL ? 'انضم الآن' : 'Join Now'}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ) : (
              statItems.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  className="group"
                >
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center hover:border-zinc-700 transition-all">
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center mx-auto mb-3 group-hover:bg-zinc-700 transition-colors">
                      <stat.icon className="h-6 w-6 text-zinc-400" />
                    </div>
                    <div className="text-3xl font-bold text-zinc-100 mb-1">
                      {stat.value.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                    </div>
                    <div className="text-sm text-zinc-500">{stat.label}</div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </div>

      {/* Decorative Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="#09090b"
          />
        </svg>
      </div>
    </section>
  )
}

'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { FileText, Users, FolderTree, MapPin, PenTool } from 'lucide-react'
import { Button } from '@/components/ui/button'

// GOVERNANCE: Real stats interface - NO FAKE NUMBERS
interface RealStats {
  articles: number
  contributors: number
  categories: number
  governorates: number
}

function AnimatedCounter({ value, suffix, locale }: { value: number; suffix: string; locale: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView && value > 0) {
      const duration = 2000
      const steps = 60
      const increment = value / steps
      let current = 0

      const timer = setInterval(() => {
        current += increment
        if (current >= value) {
          setCount(value)
          clearInterval(timer)
        } else {
          setCount(Math.floor(current))
        }
      }, duration / steps)

      return () => clearInterval(timer)
    }
  }, [isInView, value])

  return (
    <span ref={ref} className="tabular-nums">
      {value > 0 
        ? count.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')
        : '0'
      }{suffix}
    </span>
  )
}

export function StatsSection() {
  const locale = useLocale()
  const t = useTranslations()
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: '-100px' })
  const [stats, setStats] = useState<RealStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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
          // GOVERNANCE: Show zeros if API fails
          setStats({ articles: 0, contributors: 0, categories: 0, governorates: 0 })
        }
      } catch {
        setStats({ articles: 0, contributors: 0, categories: 0, governorates: 0 })
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  // GOVERNANCE: Real data icons
  const statItems = [
    {
      icon: FileText,
      value: stats?.articles ?? 0,
      label: t('stats.publishedArticles'),
      suffix: '+',
      description: t('stats.publishedArticlesDesc'),
    },
    {
      icon: Users,
      value: stats?.contributors ?? 0,
      label: t('stats.contributors'),
      suffix: '+',
      description: t('stats.contributorsDesc'),
    },
    {
      icon: FolderTree,
      value: stats?.categories ?? 0,
      label: t('stats.diverseCategories'),
      suffix: '',
      description: t('stats.diverseCategoriesDesc'),
    },
    {
      icon: MapPin,
      value: stats?.governorates ?? 0,
      label: t('stats.documentedGovernorates'),
      suffix: '',
      description: t('stats.documentedGovernoratesDesc'),
    },
  ]

  // GOVERNANCE: Empty state check
  const isEmptyState = stats && stats.articles === 0

  return (
    <section className="py-20 bg-zinc-950 relative overflow-hidden">
      {/* Minimal Background Pattern */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10" ref={containerRef}>
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-zinc-50 mb-4"
          >
            {t('stats.title')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-zinc-500 max-w-2xl mx-auto text-lg"
          >
            {t('stats.subtitle')}
          </motion.p>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          // Loading skeletons
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 animate-pulse">
                <div className="w-14 h-14 rounded-lg bg-zinc-800 mb-6" />
                <div className="h-10 bg-zinc-800 rounded mb-2" />
                <div className="h-5 bg-zinc-800 rounded mb-1" />
                <div className="h-4 bg-zinc-800 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : isEmptyState ? (
          // GOVERNANCE: Empty State - "Be the first to contribute"
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex flex-col items-center gap-6 px-8 py-12 bg-zinc-900 border border-zinc-800 rounded-xl">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                <PenTool className="h-8 w-8 text-zinc-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-zinc-100 mb-2">
                  {isRTL ? 'كن أول المساهمين' : 'Be the First Contributor'}
                </h3>
                <p className="text-zinc-500 max-w-md">
                  {isRTL 
                    ? 'الموسوعة فارغة حالياً. انضم إلينا وابدأ بكتابة أول مقال!' 
                    : 'The encyclopedia is currently empty. Join us and write the first article!'}
                </p>
              </div>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-lg font-medium transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <PenTool className="h-4 w-4" />
                {isRTL ? 'انضم الآن' : 'Join Now'}
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {statItems.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                className="group"
              >
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 hover:border-zinc-700 transition-all duration-300 h-full">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-lg bg-zinc-800 flex items-center justify-center mb-6 group-hover:bg-zinc-700 transition-colors">
                    <stat.icon className="h-7 w-7 text-zinc-400" />
                  </div>
                  
                  {/* Counter - REAL DATA */}
                  <div className="text-4xl md:text-5xl font-bold text-zinc-100 mb-2">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} locale={locale} />
                  </div>
                  
                  {/* Label */}
                  <div className="text-lg font-medium text-zinc-200 mb-1">
                    {stat.label}
                  </div>
                  
                  {/* Description */}
                  <div className="text-sm text-zinc-500">
                    {stat.description}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

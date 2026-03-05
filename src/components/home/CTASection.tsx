'use client'

import { motion } from 'framer-motion'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { ArrowLeft, PenTool, Users, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CTASection() {
  const locale = useLocale()
  const t = useTranslations()
  
  // Only Arabic is RTL
  const isRTL = locale === 'ar'
  const dir = isRTL ? 'rtl' : 'ltr'

  const features = [
    {
      icon: PenTool,
      title: t('cta.writeArticle'),
      description: t('cta.writeArticleDesc'),
    },
    {
      icon: Users,
      title: t('cta.joinCommunity'),
      description: t('cta.joinCommunityDesc'),
    },
    {
      icon: BookOpen,
      title: t('cta.discoverKnowledge'),
      description: t('cta.discoverKnowledgeDesc'),
    },
  ]

  return (
    <section className="py-20 bg-zinc-50 dark:bg-zinc-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-br from-zinc-600 to-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Content */}
              <div className="p-8 md:p-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {t('cta.title')}
                </h2>
                <p className="text-zinc-100 mb-8">
                  {t('cta.description')}
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/auth/register">
                    <Button
                      size="lg"
                      className="bg-white text-zinc-600 hover:bg-zinc-100 rounded-full px-8 focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      {t('cta.createFreeAccount')}
                      <ArrowLeft className={`${dir === 'rtl' ? 'mr-2' : 'ml-2 rotate-180'} h-4 w-4`} />
                    </Button>
                  </Link>
                  <Link href="/guide">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white text-white hover:bg-white/10 rounded-full focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      {t('cta.howToStart')}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Features */}
              <div className="bg-white/10 backdrop-blur p-8 md:p-12">
                <div className="space-y-6">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex items-start gap-4"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-1">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-zinc-100">
                          {feature.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

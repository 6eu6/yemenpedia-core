'use client'

import { motion } from 'framer-motion'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { 
  History, 
  Map, 
  Drama, 
  Users, 
  Landmark, 
  BookOpen, 
  Palette, 
  Coins,
  ArrowLeft
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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

export function CategoriesGrid() {
  const locale = useLocale()
  const t = useTranslations()
  
  // Only Arabic is RTL
  const isRTL = locale === 'ar'
  const dir = isRTL ? 'rtl' : 'ltr'

  // GOVERNANCE: Categories without fake numbers
  const categories = [
    {
      id: 'history',
      name: t('categories.history'),
      nameEn: 'History',
      description: t('categories.historyDesc'),
      icon: History,
    },
    {
      id: 'geography',
      name: t('categories.geography'),
      nameEn: 'Geography',
      description: t('categories.geographyDesc'),
      icon: Map,
    },
    {
      id: 'culture',
      name: t('categories.culture'),
      nameEn: 'Culture & Heritage',
      description: t('categories.cultureDesc'),
      icon: Drama,
    },
    {
      id: 'people',
      name: t('categories.people'),
      nameEn: 'Notable People',
      description: t('categories.peopleDesc'),
      icon: Users,
    },
    {
      id: 'places',
      name: t('categories.places'),
      nameEn: 'Places & Landmarks',
      description: t('categories.placesDesc'),
      icon: Landmark,
    },
    {
      id: 'science',
      name: t('categories.science'),
      nameEn: 'Science & Knowledge',
      description: t('categories.scienceDesc'),
      icon: BookOpen,
    },
    {
      id: 'arts',
      name: t('categories.arts'),
      nameEn: 'Literature & Arts',
      description: t('categories.artsDesc'),
      icon: Palette,
    },
    {
      id: 'economy',
      name: t('categories.economy'),
      nameEn: 'Economy',
      description: t('categories.economyDesc'),
      icon: Coins,
    },
  ]

  return (
    <section className="py-20 bg-zinc-50 dark:bg-zinc-900 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-50 mb-4"
          >
            {t('categories.title')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto text-lg"
          >
            {t('categories.subtitle')}
          </motion.p>
        </div>

        {/* Categories Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {categories.map((category) => (
            <motion.div key={category.id} variants={itemVariants}>
              <Link href={`/category/${category.id}`}>
                <Card className="group h-full hover:shadow-lg transition-all duration-300 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700">
                  <CardContent className="p-6">
                    {/* Icon */}
                    <div
                      className="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center mb-5 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-600 transition-colors"
                    >
                      <category.icon className="h-7 w-7 text-zinc-600 dark:text-zinc-300" />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-1 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-3">
                      {category.nameEn}
                    </p>
                    
                    {/* Description */}
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5 line-clamp-2 leading-relaxed">
                      {category.description}
                    </p>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-700">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        {t('common.explore')}
                      </span>
                      <ArrowLeft className={`h-4 w-4 text-zinc-400 ${dir === 'rtl' ? '' : 'rotate-180'} group-hover:-translate-x-1 transition-transform`} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link href="/categories">
            <button className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all font-medium focus-visible:ring-2 focus-visible:ring-blue-500">
              {t('categories.viewAll')}
              <ArrowLeft className={`h-5 w-5 ${dir === 'rtl' ? '' : 'rotate-180'}`} />
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

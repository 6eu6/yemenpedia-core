'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { MapPin, ArrowLeft, BookOpen, Users, FileText, ExternalLink, Mountain, Waves, Sun, TreeDeciduous, Anchor, Building2 } from 'lucide-react'
import { YemenMap, governorates } from '@/components/map/yemen-map'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Region icon mapping - NO EMOJI per Article II, Section 2.3
const getRegionIcon = (region: string) => {
  switch (region) {
    case 'north': return Mountain
    case 'west': return Waves
    case 'east': return Sun
    case 'south': return TreeDeciduous
    case 'island': return Anchor
    default: return Building2
  }
}

export function MapSection() {
  const [selectedGovernorate, setSelectedGovernorate] = useState<typeof governorates[0] | null>(null)

  return (
    <section className="py-20 bg-zinc-50 dark:bg-zinc-900 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400 text-sm mb-4"
          >
            <MapPin className="h-4 w-4" />
            استكشف اليمن
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-50 mb-4"
          >
            خريطة اليمن التفاعلية
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto text-lg"
          >
            اضغط على أي محافظة لاستكشاف مقالاتها ومعرفة المزيد عن تاريخها وتراثها
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <CardContent className="p-0">
                <YemenMap
                  onGovernorateClick={(gov) => setSelectedGovernorate(gov)}
                  selectedGovernorate={selectedGovernorate?.id}
                  className="w-full h-[500px] md:h-[600px]"
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Governorate Info Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="h-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
              {selectedGovernorate ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="h-full flex flex-col"
                >
                  {/* Header - Zinc colors per Article II, Section 2.2 */}
                  <div className="bg-zinc-900 dark:bg-zinc-800 p-6 text-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-bold">{selectedGovernorate.name}</h3>
                        <p className="text-zinc-400">{selectedGovernorate.nameEn}</p>
                      </div>
                      {(() => {
                        const RegionIcon = getRegionIcon(selectedGovernorate.region)
                        return <RegionIcon className="h-10 w-10 text-zinc-400" />
                      })()}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">العاصمة</p>
                          <p className="font-medium text-zinc-900 dark:text-zinc-50">{selectedGovernorate.capital}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                          <Users className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">عدد السكان</p>
                          <p className="font-medium text-zinc-900 dark:text-zinc-50">{selectedGovernorate.population.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">المقالات المنشورة</p>
                          <p className="font-medium text-zinc-900 dark:text-zinc-50">{selectedGovernorate.articleCount} مقالة</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <Link href={`/governorate/${selectedGovernorate.id}`}>
                        <Button className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white focus-visible:ring-2 focus-visible:ring-blue-500">
                          <BookOpen className="h-4 w-4 ml-2" />
                          استكشف المقالات
                          <ArrowLeft className="mr-2 h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/governorate/${selectedGovernorate.id}/map`}>
                        <Button variant="outline" className="w-full border-zinc-200 dark:border-zinc-700 focus-visible:ring-2 focus-visible:ring-blue-500">
                          <ExternalLink className="h-4 w-4 ml-2" />
                          عرض على الخريطة
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
                      <MapPin className="h-12 w-12 text-zinc-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                      اختر محافظة
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-xs">
                      اضغط على أي محافظة في الخريطة لعرض معلوماتها التفصيلية
                    </p>
                  </motion.div>
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Quick Links to Governorates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12"
        >
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4 text-center">
            المحافظات اليمنية الـ 22
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {governorates.map((gov) => {
              const RegionIcon = getRegionIcon(gov.region)
              return (
                <motion.div
                  key={gov.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={`/governorate/${gov.id}`}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-all focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      selectedGovernorate?.id === gov.id
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                        : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                    }`}
                  >
                    <RegionIcon className="h-4 w-4" />
                    {gov.name}
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

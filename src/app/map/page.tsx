'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { YemenMap, governorates } from '@/components/map/yemen-map'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MapPin, Search, Grid, List, Mountain, Waves, Sun, TreeDeciduous, Anchor, Building2, type LucideIcon } from 'lucide-react'

// Region icon mapping per Article II, Section 2.3 - NO EMOJI
const regionIcons: Record<string, LucideIcon> = {
  'north': Mountain,
  'west': Waves,
  'east': Sun,
  'south': TreeDeciduous,
  'island': Anchor,
  'central': Building2
}

function getRegionIcon(region: string): LucideIcon {
  return regionIcons[region] || Building2
}

export default function MapPage() {
  const router = useRouter()
  const [selectedGov, setSelectedGov] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map')

  const filteredGovernorates = governorates.filter(gov =>
    gov.name.includes(searchQuery) || 
    gov.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gov.capital?.includes(searchQuery)
  )

  const handleGovernorateClick = (governorate: typeof governorates[0]) => {
    const slug = governorate.name.replace(/\s+/g, '-')
    router.push(`/governorate/${slug}`)
  }

  // Calculate totals from governorates data
  const totalGovernorates = governorates.length
  const totalArticles = governorates.reduce((sum, g) => sum + g.articleCount, 0)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Hero - Zinc colors per Article II, Section 2.2 */}
      <div className="bg-zinc-900 dark:bg-zinc-950 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-4 text-zinc-50">خريطة اليمن التفاعلية</h1>
          <p className="text-center text-zinc-400 max-w-2xl mx-auto">
            اضغط على أي محافظة لاستكشاف مقالاتها ومعالمها
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="ابحث عن محافظة..."
              className="pr-10 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus-visible:ring-2 focus-visible:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              onClick={() => setViewMode('map')}
              className={viewMode === 'map' ? 'bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800' : 'border-zinc-200 dark:border-zinc-700 focus-visible:ring-2 focus-visible:ring-blue-500'}
            >
              <MapPin className="ml-2 h-4 w-4" />
              الخريطة
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800' : 'border-zinc-200 dark:border-zinc-700 focus-visible:ring-2 focus-visible:ring-blue-500'}
            >
              <Grid className="ml-2 h-4 w-4" />
              الشبكة
            </Button>
          </div>
        </div>

        {/* Map View */}
        {viewMode === 'map' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6 border border-zinc-200 dark:border-zinc-700"
          >
            <YemenMap
              onGovernorateClick={handleGovernorateClick}
              selectedGovernorate={selectedGov}
              className="h-[600px]"
            />
          </motion.div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filteredGovernorates.map((gov) => {
              const RegionIcon = getRegionIcon(gov.region)
              return (
                <Card
                  key={gov.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500"
                  onClick={() => handleGovernorateClick(gov)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{gov.name}</h3>
                        {gov.nameEn && (
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">{gov.nameEn}</p>
                        )}
                      </div>
                      <RegionIcon className="h-6 w-6 text-zinc-400" />
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {gov.capital && (
                        <div className="flex justify-between">
                          <span>العاصمة:</span>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">{gov.capital}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>المقالات:</span>
                        <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">{gov.articleCount}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </motion.div>
        )}

        {/* Stats - Real data per Article III, Section 3.1 */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{totalGovernorates}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">محافظة</div>
            </CardContent>
          </Card>
          <Card className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{totalArticles}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">مقال</div>
            </CardContent>
          </Card>
          <Card className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">22</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">محافظة + سقطرى</div>
            </CardContent>
          </Card>
          <Card className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                <MapPin className="h-8 w-8 mx-auto text-zinc-400" />
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">استكشف الخريطة</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

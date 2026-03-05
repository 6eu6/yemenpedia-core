'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mountain, Waves, Sun, TreeDeciduous, Anchor, Building2 } from 'lucide-react'

// GOVERNANCE COMPLIANCE: Article II, Section 2.3 - NO EMOJI
// Article III, Section 3.1 - NO FAKE NUMBERS (articleCount: 0 for all)
// Article II, Section 2.2 - Zinc color system

// Region icon mapping - using Lucide icons instead of emoji
const getRegionIconComponent = (region: string) => {
  switch (region) {
    case 'north': return Mountain
    case 'west': return Waves
    case 'east': return Sun
    case 'south': return TreeDeciduous
    case 'island': return Anchor
    default: return Building2
  }
}

// Yemen Governorates with realistic SVG paths
// Note: articleCount set to 0 per Article III (Zero Placeholder Policy)
// Real data should be fetched from database
const governorates = [
  {
    id: 'saada',
    name: 'صعدة',
    nameEn: "Sa'dah",
    capital: 'صعدة',
    population: 0, // Article III: No fake numbers
    articleCount: 0, // Article III: No fake numbers
    path: 'M 285 35 L 340 30 L 370 50 L 380 90 L 365 130 L 320 145 L 275 135 L 250 100 L 260 60 Z',
    region: 'north'
  },
  {
    id: 'amran',
    name: 'عمران',
    nameEn: "'Amran",
    capital: 'عمران',
    population: 0,
    articleCount: 0,
    path: 'M 275 135 L 320 145 L 345 165 L 335 200 L 300 215 L 260 200 L 250 165 Z',
    region: 'north'
  },
  {
    id: 'sanaa-city',
    name: 'أمانة العاصمة',
    nameEn: "Amanat Al Asimah",
    capital: 'صنعاء',
    population: 0,
    articleCount: 0,
    path: 'M 300 215 L 335 200 L 360 220 L 355 255 L 325 270 L 290 260 L 285 230 Z',
    region: 'central'
  },
  {
    id: 'sanaa',
    name: 'محافظة صنعاء',
    nameEn: "Sana'a",
    capital: 'صنعاء',
    population: 0,
    articleCount: 0,
    path: 'M 250 165 L 275 135 L 320 145 L 345 165 L 335 200 L 300 215 L 260 200 Z M 285 230 L 290 260 L 325 270 L 355 255 L 360 220 L 335 200 L 300 215 Z',
    region: 'central'
  },
  {
    id: 'al-jawf',
    name: 'الجوف',
    nameEn: 'Al Jawf',
    capital: 'الجوف',
    population: 0,
    articleCount: 0,
    path: 'M 370 50 L 450 40 L 510 60 L 530 100 L 510 145 L 450 160 L 380 145 L 365 130 L 380 90 Z',
    region: 'east'
  },
  {
    id: 'marib',
    name: 'مأرب',
    nameEn: "Ma'rib",
    capital: 'مأرب',
    population: 0,
    articleCount: 0,
    path: 'M 380 145 L 450 160 L 510 145 L 530 100 L 510 60 L 450 40 L 510 60 L 550 85 L 570 130 L 555 180 L 500 200 L 450 195 L 400 175 L 380 145 Z M 450 160 L 510 145 L 530 185 L 500 200 L 450 195 Z',
    region: 'east'
  },
  {
    id: 'hajjah',
    name: 'حجة',
    nameEn: 'Hajjah',
    capital: 'حجة',
    population: 0,
    articleCount: 0,
    path: 'M 185 130 L 250 115 L 275 135 L 260 200 L 230 220 L 185 205 L 160 170 Z',
    region: 'west'
  },
  {
    id: 'al-mahwit',
    name: 'المحويت',
    nameEn: 'Al Mahwit',
    capital: 'المحويت',
    population: 0,
    articleCount: 0,
    path: 'M 160 170 L 185 205 L 210 230 L 195 260 L 155 265 L 130 235 L 140 195 Z',
    region: 'west'
  },
  {
    id: 'raymah',
    name: 'ريمة',
    nameEn: 'Raymah',
    capital: 'الجبينية',
    population: 0,
    articleCount: 0,
    path: 'M 155 265 L 195 260 L 220 285 L 205 320 L 160 325 L 140 295 Z',
    region: 'west'
  },
  {
    id: 'dhamar',
    name: 'ذمار',
    nameEn: 'Dhamar',
    capital: 'ذمار',
    population: 0,
    articleCount: 0,
    path: 'M 260 200 L 300 215 L 335 200 L 355 255 L 340 300 L 295 315 L 250 295 L 230 260 L 250 230 Z',
    region: 'central'
  },
  {
    id: 'al-bayda',
    name: 'البيضاء',
    nameEn: 'Al Bayda',
    capital: 'البيضاء',
    population: 0,
    articleCount: 0,
    path: 'M 340 300 L 380 285 L 420 300 L 430 350 L 400 385 L 350 380 L 320 345 L 325 315 Z',
    region: 'central'
  },
  {
    id: 'hodeidah',
    name: 'الحديدة',
    nameEn: 'Al Hudaydah',
    capital: 'الحديدة',
    population: 0,
    articleCount: 0,
    path: 'M 130 235 L 155 265 L 160 325 L 205 320 L 220 285 L 230 260 L 250 295 L 240 340 L 200 370 L 145 380 L 95 350 L 85 295 L 100 250 Z',
    region: 'west'
  },
  {
    id: 'ibb',
    name: 'إب',
    nameEn: 'Ibb',
    capital: 'إب',
    population: 0,
    articleCount: 0,
    path: 'M 250 295 L 295 315 L 320 345 L 350 380 L 340 420 L 290 435 L 240 410 L 220 365 L 240 340 Z',
    region: 'south'
  },
  {
    id: 'taiz',
    name: 'تعز',
    nameEn: "Ta'izz",
    capital: 'تعز',
    population: 0,
    articleCount: 0,
    path: 'M 145 380 L 200 370 L 240 340 L 220 365 L 240 410 L 290 435 L 310 470 L 280 510 L 220 520 L 160 495 L 130 450 L 135 405 Z',
    region: 'south'
  },
  {
    id: 'al-dhale',
    name: 'الضالع',
    nameEn: 'Ad Dali',
    capital: 'الضالع',
    population: 0,
    articleCount: 0,
    path: 'M 290 435 L 340 420 L 370 445 L 360 490 L 310 510 L 280 510 L 310 470 Z',
    region: 'south'
  },
  {
    id: 'lahij',
    name: 'لحج',
    nameEn: 'Lahij',
    capital: 'لحج',
    population: 0,
    articleCount: 0,
    path: 'M 310 470 L 360 490 L 370 445 L 410 460 L 430 510 L 400 555 L 340 565 L 280 510 L 310 510 L 360 490 Z',
    region: 'south'
  },
  {
    id: 'aden',
    name: 'عدن',
    nameEn: 'Aden',
    capital: 'عدن',
    population: 0,
    articleCount: 0,
    path: 'M 400 555 L 430 510 L 480 515 L 510 550 L 490 595 L 430 605 L 385 585 L 380 560 Z',
    region: 'south'
  },
  {
    id: 'abyan',
    name: 'أبين',
    nameEn: 'Abyan',
    capital: 'زنجبار',
    population: 0,
    articleCount: 0,
    path: 'M 430 510 L 470 490 L 540 500 L 580 540 L 560 595 L 510 550 L 480 515 L 430 510 Z',
    region: 'south'
  },
  {
    id: 'shabwah',
    name: 'شبوة',
    nameEn: 'Shabwah',
    capital: 'عتق',
    population: 0,
    articleCount: 0,
    path: 'M 420 300 L 480 280 L 550 295 L 590 340 L 580 400 L 530 440 L 470 450 L 420 420 L 400 385 L 430 350 L 420 300 Z',
    region: 'east'
  },
  {
    id: 'hadramout',
    name: 'حضرموت',
    nameEn: 'Hadhramaut',
    capital: 'المكلا',
    population: 0,
    articleCount: 0,
    path: 'M 550 295 L 620 270 L 720 280 L 800 320 L 830 390 L 810 460 L 750 500 L 670 510 L 590 490 L 540 500 L 580 540 L 560 595 L 510 550 L 480 515 L 470 490 L 530 440 L 580 400 L 590 340 L 550 295 Z',
    region: 'east'
  },
  {
    id: 'al-mahrah',
    name: 'المهرة',
    nameEn: 'Al Mahrah',
    capital: 'الغيضة',
    population: 0,
    articleCount: 0,
    path: 'M 800 320 L 880 290 L 950 310 L 980 370 L 960 440 L 900 480 L 830 490 L 810 460 L 830 390 L 800 320 Z',
    region: 'east'
  },
  {
    id: 'socotra',
    name: 'سقطرى',
    nameEn: 'Socotra',
    capital: 'حديبو',
    population: 0,
    articleCount: 0,
    path: 'M 780 560 L 850 545 L 920 560 L 940 610 L 900 650 L 820 655 L 765 620 L 770 580 Z',
    region: 'island'
  },
]

interface YemenMapProps {
  onGovernorateClick?: (governorate: typeof governorates[0]) => void
  selectedGovernorate?: string | null
  className?: string
}

export function YemenMap({ onGovernorateClick, selectedGovernorate, className = '' }: YemenMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  return (
    <div 
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
    >
      <svg
        viewBox="0 0 1000 700"
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
      >
        <defs>
          {/* Zinc color gradients per Article II, Section 2.2 */}
          <linearGradient id="governorateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3f3f46" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#27272a" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="hoverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#52525b" stopOpacity="1" />
            <stop offset="100%" stopColor="#3f3f46" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="selectedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a1a1aa" stopOpacity="1" />
            <stop offset="100%" stopColor="#71717a" stopOpacity="1" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Shadow filter */}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width="1000" height="700" fill="url(#bgGradient)" rx="12" />
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fafafa" />
            <stop offset="100%" stopColor="#f4f4f5" />
          </linearGradient>
        </defs>

        {/* Country Outline */}
        <path
          d="M 95 250 L 145 170 L 185 130 L 250 115 L 285 35 L 340 30 L 370 50 L 450 40 L 510 60 L 550 85 L 620 270 L 720 280 L 800 320 L 880 290 L 950 310 L 980 370 L 960 440 L 900 480 L 830 490 L 810 460 L 750 500 L 670 510 L 590 490 L 540 500 L 580 540 L 560 595 L 510 550 L 490 595 L 430 605 L 385 585 L 340 565 L 280 510 L 220 520 L 160 495 L 130 450 L 95 350 L 85 295 L 95 250 Z"
          fill="none"
          stroke="#27272a"
          strokeWidth="2"
          strokeDasharray="8,4"
          opacity="0.3"
        />

        {/* Red Sea Label */}
        <text x="60" y="400" fill="#71717a" fontSize="14" fontWeight="500" transform="rotate(-90, 60, 400)">
          البحر الأحمر
        </text>

        {/* Arabian Sea Label */}
        <text x="600" y="640" fill="#71717a" fontSize="14" fontWeight="500">
          بحر العرب
        </text>

        {/* Gulf of Aden Label */}
        <text x="300" y="600" fill="#71717a" fontSize="12" fontWeight="500">
          خليج عدن
        </text>

        {/* Governorates */}
        {governorates.map((gov) => {
          const isHovered = hoveredId === gov.id
          const isSelected = selectedGovernorate === gov.id

          return (
            <motion.g
              key={gov.id}
              onMouseEnter={() => setHoveredId(gov.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onGovernorateClick?.(gov)}
              style={{ cursor: 'pointer' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.path
                d={gov.path}
                fill={
                  isSelected
                    ? 'url(#selectedGradient)'
                    : isHovered
                    ? 'url(#hoverGradient)'
                    : 'url(#governorateGradient)'
                }
                stroke={isHovered || isSelected ? '#a1a1aa' : '#27272a'}
                strokeWidth={isHovered || isSelected ? 2 : 0.5}
                filter={isHovered || isSelected ? 'url(#glow)' : 'url(#shadow)'}
                animate={{
                  opacity: isHovered || isSelected ? 1 : 0.85,
                }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.02 }}
                style={{ transformOrigin: 'center' }}
              />
              
              {/* Governorate Label - show on hover */}
              <AnimatePresence>
                {(isHovered || isSelected) && (
                  <motion.text
                    x={gov.path.split(' ')[1]}
                    y={parseInt(gov.path.split(' ')[2]) + 15}
                    fill={isSelected ? '#27272a' : '#FFFFFF'}
                    fontSize="14"
                    fontWeight="bold"
                    textAnchor="middle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ 
                      pointerEvents: 'none',
                      textShadow: isSelected ? 'none' : '0 1px 2px rgba(0,0,0,0.5)'
                    }}
                  >
                    {gov.name}
                  </motion.text>
                )}
              </AnimatePresence>
            </motion.g>
          )
        })}

        {/* Legend - Zinc colors */}
        <g transform="translate(20, 550)">
          <rect x="0" y="0" width="180" height="120" fill="white" rx="8" stroke="#e4e4e7" strokeWidth="1" filter="url(#shadow)" />
          <text x="15" y="25" fill="#27272a" fontSize="14" fontWeight="bold">
            خريطة اليمن
          </text>
          <text x="15" y="42" fill="#71717a" fontSize="11">
            22 محافظة + سقطرى
          </text>
          <rect x="15" y="55" width="24" height="12" fill="url(#governorateGradient)" rx="2" />
          <text x="45" y="65" fill="#71717a" fontSize="11">
            محافظة
          </text>
          <rect x="15" y="75" width="24" height="12" fill="url(#hoverGradient)" rx="2" />
          <text x="45" y="85" fill="#71717a" fontSize="11">
            محددة (hover)
          </text>
          <rect x="15" y="95" width="24" height="12" fill="url(#selectedGradient)" rx="2" />
          <text x="45" y="105" fill="#71717a" fontSize="11">
            مختارة
          </text>
        </g>

        {/* Scale */}
        <g transform="translate(850, 650)">
          <line x1="0" y1="0" x2="100" y2="0" stroke="#71717a" strokeWidth="2" />
          <line x1="0" y1="-5" x2="0" y2="5" stroke="#71717a" strokeWidth="2" />
          <line x1="100" y1="-5" x2="100" y2="5" stroke="#71717a" strokeWidth="2" />
          <text x="50" y="-10" fill="#71717a" fontSize="10" textAnchor="middle">
            ~200 كم
          </text>
        </g>
      </svg>

      {/* Floating Info Card - NO EMOJI, using Lucide icons */}
      <AnimatePresence>
        {hoveredId && (
          <motion.div
            className="absolute bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-4 z-20 min-w-[200px] border border-zinc-200 dark:border-zinc-700"
            style={{
              left: Math.min(mousePos.x + 20, 400),
              top: Math.min(mousePos.y - 100, 300),
            }}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {(() => {
              const gov = governorates.find((g) => g.id === hoveredId)
              if (!gov) return null
              const RegionIcon = getRegionIconComponent(gov.region)
              return (
                <>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">{gov.name}</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{gov.nameEn}</p>
                    </div>
                    <RegionIcon className="h-6 w-6 text-zinc-400" />
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 dark:text-zinc-400">العاصمة:</span>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">{gov.capital}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 dark:text-zinc-400">السكان:</span>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {gov.population > 0 ? gov.population.toLocaleString() : 'غير متوفر'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 dark:text-zinc-400">المقالات:</span>
                      <span className="font-medium text-zinc-600 dark:text-zinc-400">{gov.articleCount}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">انقر لاستكشاف المقالات</p>
                  </div>
                </>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { governorates }

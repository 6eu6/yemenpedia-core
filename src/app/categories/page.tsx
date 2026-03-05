import { db } from '@/lib/db'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, FolderOpen, BookOpen, Landmark, Users, Theater, Palette, Coins, FlaskConical, Globe, Mountain, Utensils, Music, Gamepad2, Plane, Heart, Scale, Wrench, type LucideIcon } from 'lucide-react'

// Force dynamic rendering - database access required
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'الأقسام | يمنبيديا',
  description: 'استكشف أقسام موسوعة اليمن الوطنية'
}

// Icon mapping per Article II, Section 2.3 - NO EMOJI
const categoryIcons: Record<string, LucideIcon> = {
  'history': Landmark,
  'geography': Mountain,
  'culture': Theater,
  'society': Users,
  'heritage': BookOpen,
  'art': Palette,
  'economy': Coins,
  'science': FlaskConical,
  'politics': Scale,
  'tourism': Plane,
  'sports': Gamepad2,
  'health': Heart,
  'technology': Wrench,
  'food': Utensils,
  'music': Music,
  'world': Globe,
  'default': FolderOpen
}

function getCategoryIcon(iconName: string | null): LucideIcon {
  if (!iconName) return FolderOpen
  return categoryIcons[iconName] || categoryIcons['default']
}

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    where: { isActive: true, parentId: null },
    include: {
      children: { where: { isActive: true } },
      _count: { select: { articles: { where: { status: 'APPROVED' } } } }
    },
    orderBy: { order: 'asc' }
  })

  const totalArticles = await db.article.count({
    where: { status: 'APPROVED' }
  })

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Hero - Zinc colors per Article II, Section 2.2 */}
      <div className="bg-zinc-900 dark:bg-zinc-950 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-4 text-zinc-50">أقسام الموسوعة</h1>
          <p className="text-center text-zinc-400 max-w-2xl mx-auto">
            استكشف المعرفة اليمنية من خلال أقسامنا المتنوعة
          </p>
          <div className="flex justify-center mt-6">
            <Badge variant="secondary" className="bg-zinc-800 text-zinc-100 text-lg py-2 px-4">
              <FileText className="ml-2 h-4 w-4" />
              {totalArticles.toLocaleString('ar-YE')} مقال
            </Badge>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="container mx-auto px-4 py-12">
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => {
              const IconComponent = getCategoryIcon(category.icon)
              return (
                <Link key={category.id} href={`/category/${category.slug}`} className="focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
                  <Card className="h-full hover:shadow-xl transition-all hover:-translate-y-1 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                        <IconComponent className="h-8 w-8 text-zinc-600 dark:text-zinc-300" />
                      </div>
                      <h2 className="text-xl font-bold mb-2 text-zinc-900 dark:text-zinc-50">{category.name}</h2>
                      {category.description && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-2">
                          {category.description}
                        </p>
                      )}
                      <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                        {category._count.articles} مقال
                      </Badge>
                      
                      {/* Subcategories */}
                      {category.children.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-2">الأقسام الفرعية:</p>
                          <div className="flex flex-wrap justify-center gap-1">
                            {category.children.slice(0, 3).map((child) => (
                              <span key={child.id} className="text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 px-2 py-1 rounded">
                                {child.name}
                              </span>
                            ))}
                            {category.children.length > 3 && (
                              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                                +{category.children.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        ) : (
          // Article III, Section 3.1: Professional "No Content Yet" state
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <FolderOpen className="h-12 w-12 text-zinc-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">لا توجد أقسام بعد</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">كن أول من يساهم في إنشاء أقسام الموسوعة</p>
          </div>
        )}
      </div>
    </div>
  )
}

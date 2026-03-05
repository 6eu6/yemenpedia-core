import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FolderTree, FileText, ArrowLeft, FolderOpen, Landmark, Mountain, Theater, Users, BookOpen, Palette, Coins, FlaskConical, Scale, Plane, Gamepad2, Heart, Wrench, Utensils, Music, Globe, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = await db.category.findUnique({
    where: { slug },
    select: { name: true, description: true }
  })

  if (!category) return { title: 'قسم غير موجود' }

  return {
    title: `${category.name} | يمنبيديا`,
    description: category.description,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  
  const category = await db.category.findUnique({
    where: { slug },
    include: {
      children: { where: { isActive: true }, orderBy: { order: 'asc' } },
      _count: { select: { articles: { where: { status: 'APPROVED' } } } }
    }
  })

  if (!category || !category.isActive) {
    notFound()
  }

  const articles = await db.article.findMany({
    where: { 
      categoryId: category.id,
      status: 'APPROVED'
    },
    include: {
      author: { select: { name: true } },
      governorate: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  })

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Hero - Zinc colors per Article II, Section 2.2 */}
      <div className="bg-zinc-900 dark:bg-zinc-950 text-white py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
            <Link href="/" className="hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-blue-500">الرئيسية</Link>
            <span>/</span>
            <Link href="/categories" className="hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-blue-500">الأقسام</Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-zinc-800 dark:bg-zinc-700 rounded-2xl flex items-center justify-center">
              <FolderTree className="h-8 w-8 text-zinc-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-zinc-50">{category.name}</h1>
              {category.description && (
                <p className="text-zinc-400 mt-2">{category.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <Badge variant="secondary" className="bg-zinc-800 text-zinc-200">
              {category._count.articles} مقال
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl py-8">
        {/* Subcategories */}
        {category.children.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">الأقسام الفرعية</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {category.children.map((child) => {
                const IconComponent = getCategoryIcon(child.icon)
                return (
                  <Link key={child.id} href={`/category/${child.slug}`} className="focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
                    <Card className="hover:shadow-lg transition-shadow border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                          <IconComponent className="h-6 w-6 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <h3 className="font-medium text-zinc-900 dark:text-zinc-50">{child.name}</h3>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Articles */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">المقالات</h2>
          {articles.length === 0 ? (
            <Card className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
                <p className="text-zinc-500 dark:text-zinc-400">لا توجد مقالات في هذا القسم بعد</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Link key={article.id} href={`/article/${article.slug}`} className="focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
                  <Card className="h-full hover:shadow-lg transition-shadow border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2 text-zinc-900 dark:text-zinc-50">{article.title}</h3>
                      {article.excerpt && (
                        <p className="text-zinc-600 dark:text-zinc-400 text-sm line-clamp-3 mb-4">{article.excerpt}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                        <span>{article.author.name}</span>
                        {article.governorate && (
                          <Badge variant="outline" className="border-zinc-200 dark:border-zinc-700">{article.governorate.name}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <Link href="/categories">
            <Button variant="ghost" className="focus-visible:ring-2 focus-visible:ring-blue-500">
              <ArrowLeft className="ml-2 h-4 w-4" />
              عرض كل الأقسام
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

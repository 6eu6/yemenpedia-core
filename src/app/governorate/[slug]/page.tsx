import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, FileText, Users, Square, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface GovernoratePageProps {
  params: Promise<{ slug: string }>
}

export default async function GovernoratePage({ params }: GovernoratePageProps) {
  const { slug } = await params
  
  const governorate = await db.governorate.findFirst({
    where: { 
      OR: [
        { name: slug.replace(/-/g, ' ') },
        { nameEn: slug.replace(/-/g, ' ') }
      ]
    }
  })

  if (!governorate) {
    notFound()
  }

  const articles = await db.article.findMany({
    where: { 
      governorateId: governorate.id,
      status: 'APPROVED'
    },
    include: {
      author: { select: { name: true } },
      category: { select: { name: true, slug: true } }
    },
    orderBy: { viewCount: 'desc' },
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
            <Link href="/map" className="hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-blue-500">المحافظات</Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-zinc-800 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
              <MapPin className="h-8 w-8 text-zinc-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-zinc-50">{governorate.name}</h1>
              {governorate.nameEn && (
                <p className="text-zinc-400">{governorate.nameEn}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-6">
            {governorate.capital && (
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-200">
                العاصمة: {governorate.capital}
              </Badge>
            )}
            {governorate.population && (
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-200">
                <Users className="ml-1 h-3 w-3" />
                {governorate.population.toLocaleString('ar-YE')} نسمة
              </Badge>
            )}
            {governorate.area && (
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-200">
                <Square className="ml-1 h-3 w-3" />
                {governorate.area.toLocaleString('ar-YE')} كم²
              </Badge>
            )}
            <Badge variant="secondary" className="bg-zinc-800 text-zinc-200">
              <FileText className="ml-1 h-3 w-3" />
              {articles.length} مقال
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl py-8">
        {/* Articles Grid */}
        {articles.length === 0 ? (
          <Card className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <CardContent className="p-12 text-center">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
              <p className="text-zinc-600 dark:text-zinc-400">لا توجد مقالات عن هذه المحافظة بعد</p>
              <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-2">كن أول من يكتب عنها!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link key={article.id} href={`/article/${article.slug}`} className="focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
                <Card className="h-full hover:shadow-lg transition-shadow border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                  <CardContent className="p-6">
                    <Badge variant="outline" className="mb-3 border-zinc-200 dark:border-zinc-700">{article.category.name}</Badge>
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 text-zinc-900 dark:text-zinc-50">{article.title}</h3>
                    {article.excerpt && (
                      <p className="text-zinc-600 dark:text-zinc-400 text-sm line-clamp-3 mb-4">{article.excerpt}</p>
                    )}
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {article.author.name}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Link href="/">
            <Button variant="ghost" className="focus-visible:ring-2 focus-visible:ring-blue-500">
              <ArrowLeft className="ml-2 h-4 w-4" />
              العودة للرئيسية
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

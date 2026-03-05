import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Users, FolderTree, Globe, Heart, Award, BookOpen } from 'lucide-react'
import Link from 'next/link'

// Force dynamic rendering - database access required
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'عن الموسوعة | يمنبيديا',
  description: 'تعرف على موسوعة اليمن الوطنية - Yemenpedia'
}

export default async function AboutPage() {
  const stats = await Promise.all([
    db.article.count({ where: { status: 'APPROVED' } }),
    db.user.count(),
    db.category.count({ where: { isActive: true } }),
    db.governorate.count()
  ])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Hero - Zinc colors per Article II, Section 2.2 */}
      <div className="bg-zinc-900 dark:bg-zinc-950 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-zinc-50">عن يمنبيديا</h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            موسوعة اليمن الوطنية - المصدر الشامل للمعرفة عن اليمن
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Stats - Zinc icon backgrounds */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <Card className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <CardContent className="pt-6 text-center">
              <FileText className="h-10 w-10 mx-auto mb-3 text-zinc-600 dark:text-zinc-400" />
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{stats[0].toLocaleString('ar-YE')}</div>
              <div className="text-zinc-500 dark:text-zinc-400">مقالة</div>
            </CardContent>
          </Card>
          <Card className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <CardContent className="pt-6 text-center">
              <Users className="h-10 w-10 mx-auto mb-3 text-zinc-600 dark:text-zinc-400" />
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{stats[1].toLocaleString('ar-YE')}</div>
              <div className="text-zinc-500 dark:text-zinc-400">كاتب ومساهم</div>
            </CardContent>
          </Card>
          <Card className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <CardContent className="pt-6 text-center">
              <FolderTree className="h-10 w-10 mx-auto mb-3 text-zinc-600 dark:text-zinc-400" />
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{stats[2]}</div>
              <div className="text-zinc-500 dark:text-zinc-400">قسم</div>
            </CardContent>
          </Card>
          <Card className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <CardContent className="pt-6 text-center">
              <Globe className="h-10 w-10 mx-auto mb-3 text-zinc-600 dark:text-zinc-400" />
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{stats[3]}</div>
              <div className="text-zinc-500 dark:text-zinc-400">محافظة</div>
            </CardContent>
          </Card>
        </div>

        {/* About Content */}
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Mission */}
          <Card className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                <BookOpen className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
                رسالتنا
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                يمنبيديا هي موسوعة وطنية شاملة تهدف إلى توثيق وتجميع المعرفة عن اليمن في جميع المجالات:
                التاريخ، الجغرافيا، الثقافة، التراث، الشخصيات، الأماكن، العلوم، والأدب.
                نسعى لتكون المصدر الأول والأكثر موثوقية للمعرفة عن اليمن للباحثين والدارسين والمهتمين.
              </p>
            </CardContent>
          </Card>

          {/* Values */}
          <Card className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                <Heart className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
                قيمنا
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl">
                  <h3 className="font-bold text-zinc-700 dark:text-zinc-300 mb-2">المصداقية</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">كل مقال يمر بمراجعة صارمة من المحققين</p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl">
                  <h3 className="font-bold text-zinc-700 dark:text-zinc-300 mb-2">الشمولية</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">نغطي جميع جوانب الحياة اليمنية</p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl">
                  <h3 className="font-bold text-zinc-700 dark:text-zinc-300 mb-2">المشاركة</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">مجتمع من الكتّاب والباحثين اليمنيين</p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl">
                  <h3 className="font-bold text-zinc-700 dark:text-zinc-300 mb-2">الانفتاح</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">المحتوى متاح للجميع مجاناً</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Roles */}
          <Card className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                <Award className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
                نظام الأدوار
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl">
                  <Badge className="bg-zinc-800 dark:bg-zinc-700">الإدارة العليا</Badge>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">إدارة كاملة للموقع والإعدادات والمستخدمين</p>
                </div>
                <div className="flex items-start gap-4 p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl">
                  <Badge className="bg-zinc-700 dark:bg-zinc-600">محقق المحتوى</Badge>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">مراجعة المقالات وضمان المصداقية</p>
                </div>
                <div className="flex items-start gap-4 p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl">
                  <Badge className="bg-zinc-600 dark:bg-zinc-500">مشرف القسم</Badge>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">مراجعة مقالات قسم معين</p>
                </div>
                <div className="flex items-start gap-4 p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl">
                  <Badge className="bg-zinc-500 dark:bg-zinc-400 text-white dark:text-zinc-900">الكاتب</Badge>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">كتابة المقالات والمساهمة بالمحتوى</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">انضم إلينا!</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              كن جزءاً من أكبر مشروع لتوثيق المعرفة اليمنية
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/auth/register">
                <Button className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 focus-visible:ring-2 focus-visible:ring-blue-500" size="lg">
                  إنشاء حساب
                </Button>
              </Link>
              <Link href="/categories">
                <Button variant="outline" size="lg" className="border-zinc-200 dark:border-zinc-700 focus-visible:ring-2 focus-visible:ring-blue-500">
                  استكشف الموسوعة
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

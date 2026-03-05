import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { ArticleView } from './article-view'

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = await db.article.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, metaTitle: true, metaDescription: true }
  })

  if (!article) return { title: 'مقال غير موجود' }

  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt,
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  
  const article = await db.article.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, name: true, image: true, bio: true } },
      category: { select: { id: true, name: true, slug: true } },
      tags: { include: { tag: true } },
      governorate: { select: { id: true, name: true, slug: true } },
      media: true,
      sources: true
    }
  })

  if (!article || article.status !== 'APPROVED') {
    notFound()
  }

  // Increment view count
  await db.article.update({
    where: { id: article.id },
    data: { viewCount: { increment: 1 } }
  })

  return <ArticleView article={article} />
}

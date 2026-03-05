import { db } from '@/lib/db'

// Force dynamic rendering - database access required
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yemenpedia.org'

  // Get all approved articles
  const articles = await db.article.findMany({
    where: { status: 'APPROVED' },
    select: { slug: true, updatedAt: true }
  })

  // Get all categories
  const categories = await db.category.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true }
  })

  // Get all governorates
  const governorates = await db.governorate.findMany({
    select: { name: true, updatedAt: true }
  })

  const articleUrls = articles.map((article) => ({
    url: `${baseUrl}/article/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const categoryUrls = categories.map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  const governorateUrls = governorates.map((gov) => ({
    url: `${baseUrl}/governorate/${gov.name.replace(/\s+/g, '-')}`,
    lastModified: gov.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/map`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/auth/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    ...articleUrls,
    ...categoryUrls,
    ...governorateUrls,
  ]
}

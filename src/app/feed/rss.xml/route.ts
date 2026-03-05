import { db } from '@/lib/db'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yemenpedia.org'

  const articles = await db.article.findMany({
    where: { status: 'APPROVED' },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      createdAt: true,
      author: { select: { name: true } },
      category: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  })

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>يمنبيديا - Yemenpedia</title>
    <link>${baseUrl}</link>
    <description>المصدر الشامل للمعرفة عن اليمن</description>
    <language>ar-YE</language>
    <atom:link href="${baseUrl}/feed/rss.xml" rel="self" type="application/rss+xml"/>
    ${articles.map(article => `
    <item>
      <title>${article.title}</title>
      <link>${baseUrl}/article/${article.slug}</link>
      <description>${(article.excerpt || article.content || '').substring(0, 200)}</description>
      <pubDate>${new Date(article.createdAt).toUTCString()}</pubDate>
      <author>${article.author.name || 'يمنبيديا'}</author>
      <category>${article.category.name}</category>
      <guid isPermaLink="true">${baseUrl}/article/${article.slug}</guid>
    </item>
    `).join('')}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}

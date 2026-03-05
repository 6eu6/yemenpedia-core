/**
 * WikiLinkService - Smart Internal Linking System
 * 
 * Wiki-style automatic linking for encyclopedia articles:
 * - Scans article text for keywords matching other article titles
 * - Links only the FIRST occurrence of each keyword
 * - Server-side execution during "Save" for performance
 * - Supports aliases and disambiguation
 * 
 * @example
 * const wikiLinkService = WikiLinkService.getInstance()
 * const linkedContent = await wikiLinkService.processContent(articleId, content)
 */

import { db } from '@/lib/db'

// ============================================
// Types & Interfaces
// ============================================

export interface TermMatch {
  term: string
  articleId: string
  articleSlug: string
  articleTitle: string
  position: number
  length: number
  type: string
  priority: number
}

export interface LinkNode {
  type: 'text' | 'link'
  text?: string
  href?: string
  articleId?: string
  articleSlug?: string
}

export interface ProcessedContent {
  content: any // TipTap JSON
  links: Array<{
    term: string
    articleId: string
    articleSlug: string
    position: number
  }>
}

// ============================================
// WikiLinkService Singleton
// ============================================

export class WikiLinkService {
  private static instance: WikiLinkService
  private termCache: Map<string, TermMatch[]> = new Map()
  private lastCacheUpdate: number = 0
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  private constructor() {}

  public static getInstance(): WikiLinkService {
    if (!WikiLinkService.instance) {
      WikiLinkService.instance = new WikiLinkService()
    }
    return WikiLinkService.instance
  }

  // ============================================
  // Term Index Management
  // ============================================

  /**
   * Refresh term cache from database
   */
  private async refreshTermCache(): Promise<void> {
    const now = Date.now()
    if (now - this.lastCacheUpdate < this.CACHE_TTL && this.termCache.size > 0) {
      return
    }

    // Load all active terms with their articles
    const terms = await db.termIndex.findMany({
      where: { isActive: true },
      include: {
        references: {
          select: { articleId: true }
        }
      }
    })

    // Clear and rebuild cache
    this.termCache.clear()

    for (const term of terms) {
      const article = await db.article.findUnique({
        where: { id: term.articleId },
        select: { id: true, slug: true, title: true }
      })

      if (article && article.slug) {
        const match: TermMatch = {
          term: term.term,
          articleId: article.id,
          articleSlug: article.slug,
          articleTitle: article.title,
          position: 0,
          length: term.term.length,
          type: term.type,
          priority: term.priority,
        }

        // Add main term
        const normalizedTerm = this.normalizeTerm(term.term)
        if (!this.termCache.has(normalizedTerm)) {
          this.termCache.set(normalizedTerm, [])
        }
        this.termCache.get(normalizedTerm)!.push(match)

        // Add aliases
        for (const alias of term.aliases) {
          const normalizedAlias = this.normalizeTerm(alias)
          if (!this.termCache.has(normalizedAlias)) {
            this.termCache.set(normalizedAlias, [])
          }
          this.termCache.get(normalizedAlias)!.push(match)
        }
      }
    }

    this.lastCacheUpdate = now
  }

  /**
   * Normalize term for matching (case-insensitive, remove diacritics)
   */
  private normalizeTerm(term: string): string {
    return term
      .toLowerCase()
      .trim()
      // Remove Arabic diacritics
      .replace(/[\u064B-\u065F\u0670]/g, '')
      // Normalize Arabic letters
      .replace(/آ/g, 'ا')
      .replace(/إ/g, 'ا')
      .replace(/أ/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
  }

  /**
   * Add term to index
   */
  public async addTerm(
    term: string,
    articleId: string,
    type: string,
    aliases: string[] = [],
    priority: number = 1
  ): Promise<void> {
    await db.termIndex.upsert({
      where: {
        term_articleId: { term, articleId }
      },
      create: {
        term,
        articleId,
        type,
        aliases,
        priority,
        isActive: true,
      },
      update: {
        aliases,
        priority,
        isActive: true,
      }
    })

    // Invalidate cache
    this.lastCacheUpdate = 0
  }

  /**
   * Auto-populate term index from existing articles
   */
  public async populateFromArticles(): Promise<number> {
    const articles = await db.article.findMany({
      where: { status: 'APPROVED' },
      select: { id: true, title: true, slug: true }
    })

    let count = 0
    for (const article of articles) {
      // Add article title as a term
      await this.addTerm(article.title, article.id, 'article', [], 1)
      count++
    }

    return count
  }

  // ============================================
  // Content Processing
  // ============================================

  /**
   * Find all term matches in text
   */
  private findMatches(text: string): Map<string, TermMatch> {
    const matches = new Map<string, TermMatch>()
    const words = text.split(/(\s+)/)

    let position = 0
    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      if (word.match(/^\s+$/)) {
        position += word.length
        continue
      }

      const normalizedWord = this.normalizeTerm(word)
      
      // Check for exact match
      const exactMatches = this.termCache.get(normalizedWord)
      if (exactMatches && exactMatches.length > 0) {
        const bestMatch = exactMatches.sort((a, b) => b.priority - a.priority)[0]
        const key = `${position}-${word}`
        matches.set(key, {
          ...bestMatch,
          position,
          length: word.length,
        })
      }

      // Check for multi-word matches (phrases)
      let phrase = word
      let phraseLength = word.length
      for (let j = i + 1; j < words.length && j < i + 5; j++) {
        phrase += words[j]
        phraseLength += words[j].length
        
        const normalizedPhrase = this.normalizeTerm(phrase)
        const phraseMatches = this.termCache.get(normalizedPhrase)
        if (phraseMatches && phraseMatches.length > 0) {
          const bestMatch = phraseMatches.sort((a, b) => b.priority - a.priority)[0]
          const key = `${position}-${phrase}`
          matches.set(key, {
            ...bestMatch,
            position,
            length: phraseLength,
          })
        }
      }

      position += word.length
    }

    return matches
  }

  /**
   * Filter matches to only first occurrence per article
   */
  private filterFirstOccurrences(matches: Map<string, TermMatch>): TermMatch[] {
    const seenArticles = new Set<string>()
    const filtered: TermMatch[] = []
    const currentArticleId = '' // Will be set during processing

    // Sort by position
    const sortedMatches = Array.from(matches.values()).sort((a, b) => a.position - b.position)

    for (const match of sortedMatches) {
      // Don't link to self
      if (seenArticles.has(match.articleId)) continue
      
      seenArticles.add(match.articleId)
      filtered.push(match)
    }

    return filtered
  }

  /**
   * Process TipTap JSON content and add links
   */
  public async processContent(
    sourceArticleId: string,
    content: any
  ): Promise<ProcessedContent> {
    await this.refreshTermCache()

    const links: Array<{
      term: string
      articleId: string
      articleSlug: string
      position: number
    }> = []

    // Track which articles we've already linked to
    const linkedArticles = new Set<string>()
    
    // Track positions to avoid overlapping links
    const usedPositions = new Set<number>()

    // Process text nodes in TipTap JSON
    const processNode = (node: any): any => {
      if (!node) return node

      // Skip if this is already a link
      if (node.marks?.some((mark: any) => mark.type === 'link')) {
        return node
      }

      if (node.type === 'text' && node.text) {
        const matches = this.findMatches(node.text)
        const firstOccurrences = this.filterFirstOccurrences(matches)

        if (firstOccurrences.length === 0) {
          return node
        }

        // Convert to multiple text nodes with links
        const newNodes: any[] = []
        let currentPos = 0
        const text = node.text

        for (const match of firstOccurrences) {
          // Skip if we've already linked to this article
          if (linkedArticles.has(match.articleId)) continue
          
          // Skip if position overlaps with existing link
          if (usedPositions.has(match.position)) continue

          // Add text before the match
          if (match.position > currentPos) {
            newNodes.push({
              type: 'text',
              text: text.slice(currentPos, match.position),
              marks: node.marks || [],
            })
          }

          // Add the linked text
          newNodes.push({
            type: 'text',
            text: text.slice(match.position, match.position + match.length),
            marks: [
              ...(node.marks || []),
              {
                type: 'link',
                attrs: {
                  href: `/article/${match.articleSlug}`,
                  'data-article-id': match.articleId,
                  'data-link-type': 'wiki',
                  class: 'wiki-link',
                },
              },
            ],
          })

          links.push({
            term: match.term,
            articleId: match.articleId,
            articleSlug: match.articleSlug,
            position: match.position,
          })

          linkedArticles.add(match.articleId)
          usedPositions.add(match.position)
          currentPos = match.position + match.length
        }

        // Add remaining text
        if (currentPos < text.length) {
          newNodes.push({
            type: 'text',
            text: text.slice(currentPos),
            marks: node.marks || [],
          })
        }

        return newNodes.length > 0 ? newNodes : node
      }

      // Recursively process children
      if (node.content) {
        return {
          ...node,
          content: node.content.flatMap((child: any) => processNode(child)).flat(),
        }
      }

      return node
    }

    const processedContent = processNode(content)

    // Save links to database
    await this.saveLinks(sourceArticleId, links)

    return {
      content: processedContent,
      links,
    }
  }

  /**
   * Save article links to database
   */
  private async saveLinks(
    sourceId: string,
    links: Array<{ term: string; articleId: string; articleSlug: string; position: number }>
  ): Promise<void> {
    // Delete existing auto-links
    await db.articleLink.deleteMany({
      where: {
        sourceId,
        autoLinked: true,
      },
    })

    // Create new links
    for (const link of links) {
      try {
        await db.articleLink.create({
          data: {
            sourceId,
            targetId: link.articleId,
            anchorText: link.term,
            position: link.position,
            autoLinked: true,
          },
        })
      } catch {
        // Skip duplicate links
      }
    }
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Get all articles that link to a specific article
   */
  public async getIncomingLinks(articleId: string): Promise<Array<{
    sourceId: string
    sourceTitle: string
    sourceSlug: string
    anchorText: string
  }>> {
    const links = await db.articleLink.findMany({
      where: { targetId: articleId },
      include: {
        source: {
          select: { id: true, title: true, slug: true }
        }
      }
    })

    return links.map(link => ({
      sourceId: link.source.id,
      sourceTitle: link.source.title,
      sourceSlug: link.source.slug || link.source.id,
      anchorText: link.anchorText,
    }))
  }

  /**
   * Get all articles linked from a specific article
   */
  public async getOutgoingLinks(articleId: string): Promise<Array<{
    targetId: string
    targetTitle: string
    targetSlug: string
    anchorText: string
  }>> {
    const links = await db.articleLink.findMany({
      where: { sourceId: articleId },
      include: {
        target: {
          select: { id: true, title: true, slug: true }
        }
      }
    })

    return links.map(link => ({
      targetId: link.target.id,
      targetTitle: link.target.title,
      targetSlug: link.target.slug || link.target.id,
      anchorText: link.anchorText,
    }))
  }

  /**
   * Get preview data for hover cards
   */
  public async getArticlePreview(articleId: string): Promise<{
    title: string
    excerpt: string | null
    image: string | null
  } | null> {
    const article = await db.article.findUnique({
      where: { id: articleId },
      select: {
        title: true,
        excerpt: true,
        media: {
          where: { type: 'IMAGE' },
          take: 1,
          select: { url: true }
        }
      }
    })

    if (!article) return null

    return {
      title: article.title,
      excerpt: article.excerpt,
      image: article.media[0]?.url || null,
    }
  }
}

// Export singleton instance
export const wikiLinkService = WikiLinkService.getInstance()

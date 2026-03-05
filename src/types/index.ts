// =============================================
// Yemenpedia - Type Definitions
// =============================================
// IMPORTANT: These types must align with Prisma schema exactly

// Import Role from config instead of Prisma (for flexibility)
import type { RoleName } from '@/config/roles.config'

// Re-export Prisma types for type safety (excluding Role which is now a string)
import type { 
  ArticleStatus as PrismaArticleStatus,
  MediaType as PrismaMediaType,
  NotificationType as PrismaNotificationType,
  BadgeType as PrismaBadgeType
} from '@prisma/client'

// Re-export types
export type { 
  RoleName as Role,
  PrismaArticleStatus,
  PrismaMediaType,
  PrismaNotificationType,
  PrismaBadgeType
}

// Re-export from config
export type { RoleName } from '@/config/roles.config'

// Article Status - matches Prisma enum exactly
export type ArticleStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED'

// Media Type - matches Prisma enum exactly
export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'MAP'

// Notification Types - matches Prisma enum exactly
export type NotificationType = 
  | 'ARTICLE_REVIEWED' 
  | 'ARTICLE_APPROVED' 
  | 'ARTICLE_REJECTED' 
  | 'NEW_MESSAGE' 
  | 'SYSTEM' 
  | 'BADGE_EARNED' 
  | 'POINTS_EARNED' 
  | 'CATEGORY_APPROVED' 
  | 'WELCOME'

// Badge Types - matches Prisma enum exactly
export type BadgeType = 
  | 'CONTRIBUTOR' 
  | 'ACTIVE_WRITER' 
  | 'EXPERT_WRITER' 
  | 'VERIFIED_AUTHOR' 
  | 'TOP_CONTRIBUTOR' 
  | 'PIONEER' 
  | 'REVIEWER' 
  | 'SUPERVISOR_BADGE'

// =============================================
// User Types
// =============================================
export interface User {
  id: string
  email: string
  username: string | null
  name: string | null
  image: string | null
  coverImage: string | null
  bio: string | null
  phone: string | null
  location: string | null
  website: string | null
  socialLinks: SocialLinks | null
  password: string | null
  role: string  // Role is now a string for flexibility
  points: number
  isVerified: boolean
  isActive: boolean
  isBanned: boolean
  googleId: string | null
  facebookId: string | null
  preferredLang: string
  settings: UserSettings | null
  emailVerifiedAt: Date | null
  lastLoginAt: Date | null
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface SocialLinks {
  twitter?: string
  facebook?: string
  linkedin?: string
  instagram?: string
  youtube?: string
}

export interface UserSettings {
  notifications: {
    email: boolean
    push: boolean
    articles: boolean
    messages: boolean
  }
  theme: 'light' | 'dark' | 'system'
  language: string
}

export interface UserBadge {
  id: string
  userId: string
  badgeType: BadgeType
  earnedAt: Date
}

// =============================================
// Category Types
// =============================================
export interface Category {
  id: string
  name: string
  nameEn: string | null
  slug: string
  description: string | null
  descriptionEn: string | null
  icon: string | null
  image: string | null
  parentId: string | null
  order: number
  isActive: boolean
  metaTitle: string | null
  metaDescription: string | null
  articleCount: number
  viewCount: number
  createdAt: Date
  updatedAt: Date
  createdBy: string | null
}

export interface CategoryTree extends Category {
  children: CategoryTree[]
}

// =============================================
// Governorate Types
// =============================================
export interface Governorate {
  id: string
  name: string
  nameEn: string | null
  nameLocal: string | null
  capital: string | null
  capitalEn: string | null
  svgPath: string | null
  coordinates: Coordinates | null
  population: number | null
  area: number | null
  image: string | null
  flag: string | null
  articleCount: number
  viewCount: number
  createdAt: Date
  updatedAt: Date
}

export interface Coordinates {
  lat: number
  lng: number
  zoom: number
}

// =============================================
// Article Types - ALIGNED WITH PRISMA SCHEMA
// =============================================
export interface Article {
  id: string
  title: string
  titleEn: string | null
  slug: string
  excerpt: string | null
  excerptEn: string | null
  content: Record<string, unknown>
  contentEn: Record<string, unknown> | null
  status: ArticleStatus
  categoryId: string
  governorateId: string | null
  // Note: districtId removed - not in Prisma schema
  authorId: string
  reviewedBy: string | null
  reviewedAt: Date | null
  reviewNotes: string | null
  isFeatured: boolean
  featuredAt: Date | null
  metaTitle: string | null
  metaDescription: string | null
  keywords: string | null
  viewCount: number
  likeCount: number
  commentCount: number
  bookmarkCount: number
  primaryLang: string
  publishedAt: Date | null
  featuredImage: string | null
  featuredImageAlt: string | null
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
  
  // Relations
  category: Category
  governorate: Governorate | null
  author: User
  reviewer: User | null
  tags: ArticleTagRelation[]
  media: ArticleMedia[]
  citations: ArticleCitation[]
  likes: ArticleLike[]
  bookmarks: ArticleBookmark[]
  reviews: ArticleReview[]
  versions: ArticleVersion[]
  comments: Comment[]
}

// ArticleMedia - ALIGNED WITH PRISMA SCHEMA
export interface ArticleMedia {
  id: string
  articleId: string
  url: string
  thumbnail: string | null
  mimeType: string | null
  width: number | null
  height: number | null
  caption: string | null
  order: number
  createdAt: Date
  altText: string | null      // Was: alt
  coordinates: Record<string, unknown> | null
  duration: number | null
  embedUrl: string | null
  filename: string | null     // Was: fileName
  publicId: string | null
  size: number | null         // Was: fileSize
  videoId: string | null
  type: MediaType
}

// ArticleCitation - matches Prisma schema (was ArticleSource)
export interface ArticleCitation {
  id: string
  articleId: string
  title: string
  url: string | null
  author: string | null
  publisher: string | null
  publishDate: string | null
  pageNumbers: string | null
  isbn: string | null
  doi: string | null
  position: number
  createdAt: Date
}

// Legacy alias for backwards compatibility
export type ArticleSource = ArticleCitation

export interface ArticleTagRelation {
  id: string
  articleId: string
  tagId: string
  tag: Tag
}

export interface Tag {
  id: string
  name: string
  nameEn: string | null
  slug: string
  articleCount: number
  createdAt: Date
}

export interface ArticleLike {
  id: string
  articleId: string
  userId: string
  createdAt: Date
}

export interface ArticleBookmark {
  id: string
  articleId: string
  userId: string
  createdAt: Date
}

export interface ArticleReview {
  id: string
  articleId: string
  reviewerId: string
  status: ArticleStatus
  notes: string | null
  changes: string | null
  reviewedAt: Date
}

export interface ArticleVersion {
  id: string
  articleId: string
  version: number
  title: string
  changeNote: string | null
  editedBy: string
  editedAt: Date
  content: Record<string, unknown>
}

// =============================================
// Comment Types
// =============================================
export interface Comment {
  id: string
  articleId: string
  userId: string
  parentId: string | null
  content: string
  isEdited: boolean
  isHidden: boolean
  likeCount: number
  createdAt: Date
  updatedAt: Date
  
  user: User
  parent: Comment | null
  replies: Comment[]
}

// =============================================
// Message Types
// =============================================
export interface Message {
  id: string
  senderId: string
  receiverId: string
  subject: string | null
  content: string
  isRead: boolean
  readAt: Date | null
  isArchived: boolean
  isDeleted: boolean
  createdAt: Date
  
  sender: User
  receiver: User
}

// =============================================
// Notification Types
// =============================================
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data: Record<string, unknown> | null
  isRead: boolean
  readAt: Date | null
  createdAt: Date
}

// =============================================
// Settings Types
// =============================================
export interface SiteSettings {
  siteName: string
  siteDescription: string
  siteKeywords: string
  logo: string
  favicon: string
  footerText: string
  socialLinks: SocialLinks
  contactEmail: string
  contactPhone: string
  address: string
  enableRegistration: boolean
  enableComments: boolean
  enableGuestReading: boolean
  maintenanceMode: boolean
  defaultLanguage: string
  supportedLanguages: string[]
}

// =============================================
// API Response Types
// =============================================
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: Pagination
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

// =============================================
// Dashboard Stats Types
// =============================================
export interface DashboardStats {
  totalArticles: number
  pendingArticles: number
  totalUsers: number
  totalViews: number
  articlesThisMonth: number
  usersThisMonth: number
  viewsThisMonth: number
  topCategories: { name: string; count: number }[]
  topGovernorates: { name: string; count: number }[]
  recentActivity: ActivityLogEntry[]
}

export interface ActivityLogEntry {
  id: string
  userId: string
  action: string
  entityType: string | null
  entityId: string | null
  metadata: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

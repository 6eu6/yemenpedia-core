// =============================================
// Yemenpedia - Type Definitions
// =============================================

// User Roles
export type UserRole = 'ADMIN' | 'VERIFIER' | 'SUPERVISOR' | 'WRITER' | 'VISITOR'

// Article Status
export type ArticleStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED'

// Category Request Status
export type CategoryRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

// Notification Types
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

// Badge Types
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
  name: string | null
  image: string | null
  bio: string | null
  phone: string | null
  location: string | null
  website: string | null
  socialLinks: SocialLinks | null
  role: UserRole
  points: number
  isVerified: boolean
  isActive: boolean
  isBanned: boolean
  preferredLang: string
  settings: UserSettings | null
  badges: UserBadge[]
  emailVerifiedAt: Date | null
  lastLoginAt: Date | null
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
  parent: Category | null
  children: Category[]
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
// Article Types
// =============================================
export interface Article {
  id: string
  title: string
  titleEn: string | null
  slug: string
  excerpt: string | null
  excerptEn: string | null
  content: string
  contentEn: string | null
  status: ArticleStatus
  categoryId: string
  governorateId: string | null
  districtId: string | null
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
  createdAt: Date
  updatedAt: Date
  
  // Relations
  category: Category
  governorate: Governorate | null
  author: User
  tags: ArticleTag[]
  media: ArticleMedia[]
  sources: ArticleSource[]
}

export interface ArticleMedia {
  id: string
  articleId: string
  type: 'image' | 'video' | 'document' | 'map'
  url: string
  thumbnail: string | null
  caption: string | null
  captionEn: string | null
  alt: string | null
  fileName: string | null
  fileSize: number | null
  mimeType: string | null
  width: number | null
  height: number | null
  order: number
  createdAt: Date
}

export interface ArticleSource {
  id: string
  articleId: string
  title: string
  url: string | null
  author: string | null
  publisher: string | null
  publishDate: string | null
  pageNumbers: string | null
  createdAt: Date
}

export interface ArticleTag {
  id: string
  tagId: string
  tag: Tag
}

export interface Tag {
  id: string
  name: string
  nameEn: string | null
  slug: string
  articleCount: number
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
  recentActivity: ActivityLog[]
}

export interface ActivityLog {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string | null
  details: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  user: User
}

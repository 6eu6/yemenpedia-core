// =============================================
// Yemenpedia - Zod Validation Schemas
// =============================================

import { z } from 'zod'

// =============================================
// Auth Validation Schemas
// =============================================

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
    .max(100, 'الاسم يجب أن يكون أقل من 100 حرف')
    .regex(/^[\p{L}\s\-']+$/u, 'الاسم يمكن أن يحتوي على أحرف ومسافات فقط'),
  email: z
    .string()
    .email('البريد الإلكتروني غير صالح')
    .min(1, 'البريد الإلكتروني مطلوب'),
  password: z
    .string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل')
    .regex(/[a-z]/, 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل')
    .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل'),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.confirmPassword && data.password !== data.confirmPassword) {
    return false
  }
  return true
}, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
})

export const loginSchema = z.object({
  email: z
    .string()
    .email('البريد الإلكتروني غير صالح')
    .min(1, 'البريد الإلكتروني مطلوب'),
  password: z
    .string()
    .min(1, 'كلمة المرور مطلوبة'),
  rememberMe: z.boolean().optional(),
})

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('البريد الإلكتروني غير صالح')
    .min(1, 'البريد الإلكتروني مطلوب'),
})

export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'رمز إعادة التعيين مطلوب'),
  password: z
    .string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل')
    .regex(/[a-z]/, 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل')
    .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل'),
  confirmPassword: z
    .string()
    .min(1, 'تأكيد كلمة المرور مطلوب'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
})

export const verifyEmailSchema = z.object({
  token: z
    .string()
    .min(1, 'رمز التحقق مطلوب'),
})

// =============================================
// Category Validation Schemas
// =============================================

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'اسم القسم يجب أن يكون حرفين على الأقل')
    .max(100, 'اسم القسم يجب أن يكون أقل من 100 حرف'),
  nameEn: z
    .string()
    .max(100, 'الاسم بالإنجليزية يجب أن يكون أقل من 100 حرف')
    .optional()
    .nullable(),
  slug: z
    .string()
    .min(2, 'الرابط يجب أن يكون حرفين على الأقل')
    .max(100, 'الرابط يجب أن يكون أقل من 100 حرف')
    .regex(/^[a-z0-9-]+$/, 'الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط'),
  description: z
    .string()
    .max(500, 'الوصف يجب أن يكون أقل من 500 حرف')
    .optional()
    .nullable(),
  descriptionEn: z
    .string()
    .max(500, 'الوصف بالإنجليزية يجب أن يكون أقل من 500 حرف')
    .optional()
    .nullable(),
  icon: z
    .string()
    .max(50, 'اسم الأيقونة يجب أن يكون أقل من 50 حرف')
    .optional()
    .nullable(),
  image: z
    .string()
    .url('رابط الصورة غير صالح')
    .optional()
    .nullable(),
  parentId: z
    .string()
    .optional()
    .nullable(),
  order: z
    .number()
    .int('الترتيب يجب أن يكون رقماً صحيحاً')
    .min(0, 'الترتيب يجب أن يكون صفراً أو أكبر')
    .optional(),
  isActive: z.boolean().optional(),
  metaTitle: z
    .string()
    .max(100, 'عنوان SEO يجب أن يكون أقل من 100 حرف')
    .optional()
    .nullable(),
  metaDescription: z
    .string()
    .max(200, 'وصف SEO يجب أن يكون أقل من 200 حرف')
    .optional()
    .nullable(),
})

export const updateCategorySchema = createCategorySchema.partial()

// =============================================
// Article Validation Schemas
// =============================================

export const createArticleSchema = z.object({
  title: z
    .string()
    .min(5, 'عنوان المقال يجب أن يكون 5 أحرف على الأقل')
    .max(200, 'عنوان المقال يجب أن يكون أقل من 200 حرف'),
  titleEn: z
    .string()
    .max(200, 'العنوان بالإنجليزية يجب أن يكون أقل من 200 حرف')
    .optional()
    .nullable(),
  slug: z
    .string()
    .min(5, 'الرابط يجب أن يكون 5 أحرف على الأقل')
    .max(200, 'الرابط يجب أن يكون أقل من 200 حرف')
    .regex(/^[a-z0-9-]+$/, 'الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط'),
  excerpt: z
    .string()
    .max(500, 'المقتطف يجب أن يكون أقل من 500 حرف')
    .optional()
    .nullable(),
  excerptEn: z
    .string()
    .max(500, 'المقتطف بالإنجليزية يجب أن يكون أقل من 500 حرف')
    .optional()
    .nullable(),
  content: z
    .string()
    .min(50, 'محتوى المقال يجب أن يكون 50 حرفاً على الأقل'),
  contentEn: z
    .string()
    .optional()
    .nullable(),
  categoryId: z
    .string()
    .min(1, 'القسم مطلوب'),
  governorateId: z
    .string()
    .optional()
    .nullable(),
  districtId: z
    .string()
    .optional()
    .nullable(),
  status: z
    .enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED'])
    .optional()
    .default('DRAFT'),
  isFeatured: z.boolean().optional().default(false),
  metaTitle: z
    .string()
    .max(100, 'عنوان SEO يجب أن يكون أقل من 100 حرف')
    .optional()
    .nullable(),
  metaDescription: z
    .string()
    .max(200, 'وصف SEO يجب أن يكون أقل من 200 حرف')
    .optional()
    .nullable(),
  keywords: z
    .string()
    .max(200, 'الكلمات المفتاحية يجب أن تكون أقل من 200 حرف')
    .optional()
    .nullable(),
  primaryLang: z
    .string()
    .length(2, 'رمز اللغة يجب أن يكون حرفين')
    .optional()
    .default('ar'),
  tags: z
    .array(z.string())
    .optional(),
  sources: z
    .array(z.object({
      title: z.string(),
      url: z.string().url().optional().nullable(),
      author: z.string().optional().nullable(),
      publisher: z.string().optional().nullable(),
      publishDate: z.string().optional().nullable(),
      pageNumbers: z.string().optional().nullable(),
    }))
    .optional(),
})

export const updateArticleSchema = createArticleSchema.partial().extend({
  status: z
    .enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED'])
    .optional(),
})

// =============================================
// Pagination & Query Validation Schemas
// =============================================

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => parseInt(val || '1', 10))
    .refine((val) => val > 0, { message: 'رقم الصفحة يجب أن يكون أكبر من صفر' }),
  limit: z
    .string()
    .optional()
    .transform((val) => parseInt(val || '10', 10))
    .refine((val) => val > 0 && val <= 100, { message: 'عدد العناصر يجب أن يكون بين 1 و 100' }),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export const articlesQuerySchema = paginationSchema.extend({
  categoryId: z.string().optional(),
  governorateId: z.string().optional(),
  authorId: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED']).optional(),
  isFeatured: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  tag: z.string().optional(),
})

export const categoriesQuerySchema = paginationSchema.extend({
  parentId: z.string().optional().nullable(),
  isActive: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  tree: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
})

// =============================================
// ID Parameter Validation
// =============================================

export const idParamSchema = z.object({
  id: z.string().min(1, 'المعرف مطلوب'),
})

export const slugParamSchema = z.object({
  slug: z.string().min(1, 'الرابط مطلوب'),
})

// =============================================
// Username Validation Schema
// =============================================

export const usernameCheckSchema = z.object({
  username: z
    .string()
    .min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل')
    .max(30, 'اسم المستخدم يجب أن يكون أقل من 30 حرف')
    .regex(/^[a-zA-Z0-9_]+$/, 'اسم المستخدم يمكن أن يحتوي على أحرف إنجليزية وأرقام وشرطات سفلية فقط'),
  excludeUserId: z.string().optional(),
})

// =============================================
// Follow Validation Schema
// =============================================

export const followSchema = z.object({
  followerId: z
    .string()
    .min(1, 'معرف المتابع مطلوب'),
  followingId: z
    .string()
    .min(1, 'معرف المستخدم المتابَع مطلوب'),
}).refine((data) => data.followerId !== data.followingId, {
  message: 'لا يمكنك متابعة نفسك',
  path: ['followingId'],
})

export const followQuerySchema = z.object({
  userId: z
    .string()
    .min(1, 'معرف المستخدم مطلوب'),
  currentUserId: z.string().optional(),
})

// =============================================
// Profile Update Validation Schema
// =============================================

export const profileUpdateSchema = z.object({
  userId: z
    .string()
    .min(1, 'معرف المستخدم مطلوب'),
  name: z
    .string()
    .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
    .max(100, 'الاسم يجب أن يكون أقل من 100 حرف')
    .regex(/^[\p{L}\s\-']+$/u, 'الاسم يمكن أن يحتوي على أحرف ومسافات فقط')
    .optional()
    .nullable(),
  bio: z
    .string()
    .max(500, 'النبذة يجب أن تكون أقل من 500 حرف')
    .optional()
    .nullable(),
  location: z
    .string()
    .max(100, 'الموقع يجب أن يكون أقل من 100 حرف')
    .optional()
    .nullable(),
  website: z
    .string()
    .url('رابط الموقع غير صالح')
    .max(200, 'رابط الموقع يجب أن يكون أقل من 200 حرف')
    .optional()
    .nullable()
    .or(z.literal('')), // Allow empty string
  image: z
    .string()
    .url('رابط الصورة غير صالح')
    .optional()
    .nullable()
    .or(z.literal('')),
  coverImage: z
    .string()
    .url('رابط صورة الغلاف غير صالح')
    .optional()
    .nullable()
    .or(z.literal('')),
  socialLinks: z
    .object({
      twitter: z.string().url('رابط تويتر غير صالح').optional().nullable().or(z.literal('')),
      facebook: z.string().url('رابط فيسبوك غير صالح').optional().nullable().or(z.literal('')),
      instagram: z.string().url('رابط إنستغرام غير صالح').optional().nullable().or(z.literal('')),
      youtube: z.string().url('رابط يوتيوب غير صالح').optional().nullable().or(z.literal('')),
      linkedin: z.string().url('رابط لينكد إن غير صالح').optional().nullable().or(z.literal('')),
    })
    .optional()
    .nullable(),
})

export const profileQuerySchema = z.object({
  userId: z
    .string()
    .min(1, 'معرف المستخدم مطلوب'),
})

// =============================================
// Type exports
// =============================================

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type CreateArticleInput = z.infer<typeof createArticleSchema>
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type ArticlesQueryInput = z.infer<typeof articlesQuerySchema>
export type CategoriesQueryInput = z.infer<typeof categoriesQuerySchema>
export type UsernameCheckInput = z.infer<typeof usernameCheckSchema>
export type FollowInput = z.infer<typeof followSchema>
export type FollowQueryInput = z.infer<typeof followQuerySchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type ProfileQueryInput = z.infer<typeof profileQuerySchema>

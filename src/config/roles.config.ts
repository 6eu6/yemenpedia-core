// =============================================
// Yemenpedia - Roles Configuration
// نظام الأدوار والصلاحيات - قابل للتوسع بسهولة
// =============================================
//
// لإضافة دور جديد:
// 1. أضف اسم الدور في ROLE_NAMES
// 2. أضف ترتيب الدور في ROLE_HIERARCHY
// 3. أضف صلاحيات الدور في ROLE_PERMISSIONS
// 4. أضف معلومات الدور في ROLE_INFO
//
// مثال:
// ROLE_NAMES.TRANSLATOR = 'TRANSLATOR'
// ROLE_HIERARCHY: [..., 'TRANSLATOR', ...]
// ROLE_PERMISSIONS.TRANSLATOR = ['read:articles', 'translate:articles']
// =============================================

// =============================================
// 1. أسماء الأدوار - ROLE NAMES
// =============================================
// أضف أي دور جديد هنا
export const ROLE_NAMES = {
  // أدوار أساسية
  MEMBER: 'MEMBER',           // عضو عادي
  EDITOR: 'EDITOR',           // محرر
  MODERATOR: 'MODERATOR',     // مشرف
  ADMIN: 'ADMIN',             // مدير

  // أدوار إضافية (يمكن تفعيلها عند الحاجة)
  // WRITER: 'WRITER',        // كاتب
  // TRANSLATOR: 'TRANSLATOR', // مترجم
  // VERIFIER: 'VERIFIER',    // محقق
  // SUPERVISOR: 'SUPERVISOR', // مشرف عام
} as const

// نوع الدور
export type RoleName = typeof ROLE_NAMES[keyof typeof ROLE_NAMES]

// =============================================
// 2. ترتيب الأدوار - ROLE HIERARCHY
// =============================================
// من الأقل إلى الأعلى صلاحية
// الأدوار الأعلى ترث صلاحيات الأدوار الأقل
export const ROLE_HIERARCHY: RoleName[] = [
  'MEMBER',
  'EDITOR',
  'MODERATOR',
  'ADMIN',
]

// =============================================
// 3. صلاحيات الأدوار - ROLE PERMISSIONS
// =============================================
export const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  // عضو عادي
  MEMBER: [
    'read:articles',
    'read:categories',
    'read:governorates',
    'write:comments',
    'edit:own_profile',
    'create:articles',
    'edit:own_articles',
    'bookmark:articles',
    'like:articles',
    'follow:users',
  ],

  // محرر
  EDITOR: [
    'read:articles',
    'read:categories',
    'read:governorates',
    'write:comments',
    'edit:own_profile',
    'create:articles',
    'edit:own_articles',
    'bookmark:articles',
    'like:articles',
    'follow:users',
    'edit:all_articles',
    'review:articles',
    'request:categories',
    'translate:articles',
  ],

  // مشرف
  MODERATOR: [
    'read:articles',
    'read:categories',
    'read:governorates',
    'write:comments',
    'edit:own_profile',
    'create:articles',
    'edit:own_articles',
    'bookmark:articles',
    'like:articles',
    'follow:users',
    'edit:all_articles',
    'review:articles',
    'request:categories',
    'translate:articles',
    'moderate:content',
    'manage:users',
    'delete:articles',
    'ban:users',
    'manage:comments',
  ],

  // مدير
  ADMIN: [
    'read:all',
    'write:all',
    'edit:all',
    'delete:all',
    'manage:users',
    'manage:roles',
    'manage:categories',
    'manage:governorates',
    'manage:settings',
    'manage:media',
    'access:admin_panel',
    'moderate:all',
    'backup:database',
    'view:logs',
    'manage:notifications',
  ],
}

// =============================================
// 4. معلومات الأدوار - ROLE INFO
// =============================================
export const ROLE_INFO: Record<RoleName, {
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  color: string      // لون الشارة
  icon: string       // أيقونة الدور
}> = {
  MEMBER: {
    name: 'عضو',
    nameEn: 'Member',
    description: 'عضو مسجل في الموسوعة',
    descriptionEn: 'Registered member of the encyclopedia',
    color: 'bg-gray-500',
    icon: 'User',
  },
  EDITOR: {
    name: 'محرر',
    nameEn: 'Editor',
    description: 'محرر محتوى يمكنه تعديل ومراجعة المقالات',
    descriptionEn: 'Content editor who can edit and review articles',
    color: 'bg-blue-500',
    icon: 'Edit',
  },
  MODERATOR: {
    name: 'مشرف',
    nameEn: 'Moderator',
    description: 'مشرف يمكنه إدارة المحتوى والمستخدمين',
    descriptionEn: 'Moderator who can manage content and users',
    color: 'bg-purple-500',
    icon: 'Shield',
  },
  ADMIN: {
    name: 'مدير',
    nameEn: 'Administrator',
    description: 'مدير النظام بصلاحيات كاملة',
    descriptionEn: 'System administrator with full permissions',
    color: 'bg-red-500',
    icon: 'Crown',
  },
}

// =============================================
// 5. دوال مساعدة - HELPER FUNCTIONS
// =============================================

// التحقق من وجود دور
export function isValidRole(role: string): role is RoleName {
  return Object.values(ROLE_NAMES).includes(role as RoleName)
}

// الحصول على صلاحيات دور معين
export function getRolePermissions(role: string): string[] {
  if (!isValidRole(role)) return []
  return ROLE_PERMISSIONS[role]
}

// التحقق من صلاحية معينة
export function hasPermission(role: string, permission: string): boolean {
  const permissions = getRolePermissions(role)
  return permissions.includes(permission) || permissions.includes('read:all') || permissions.includes('edit:all')
}

// مقارنة مستوى الدور (1 = أعلى، 4 = أقل)
export function getRoleLevel(role: string): number {
  const index = ROLE_HIERARCHY.indexOf(role as RoleName)
  return index === -1 ? ROLE_HIERARCHY.length : ROLE_HIERARCHY.length - index
}

// التحقق من أن دور أعلى من آخر
export function isRoleHigher(role1: string, role2: string): boolean {
  return getRoleLevel(role1) > getRoleLevel(role2)
}

// الحصول على الأدوار التي يمكن لمستخدم معين إدارتها
export function getManageableRoles(userRole: string): RoleName[] {
  const level = getRoleLevel(userRole)
  return ROLE_HIERARCHY.filter(role => getRoleLevel(role) < level)
}

// الحصول على كل الأدوار (للقوائم)
export function getAllRoles(): RoleName[] {
  return [...ROLE_HIERARCHY]
}

// الحصول على معلومات دور
export function getRoleInfo(role: string) {
  if (!isValidRole(role)) return null
  return ROLE_INFO[role]
}

// =============================================
// 6. ثوابت الأدوار - للتوافق مع الكود القديم
// =============================================
// هذه الثوابت للتوافق مع الكود القديم
// يفضل استخدام ROLE_NAMES بدلاً منها

export const ROLES = {
  MEMBER: 'MEMBER',
  EDITOR: 'EDITOR',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
} as const

// =============================================
// 7. أدوار المساهمين - CONTRIBUTOR ROLES
// =============================================
// الأدوار التي تعتبر مساهمين (للإحصائيات)
export const CONTRIBUTOR_ROLES: RoleName[] = [
  'ADMIN',
  'MODERATOR',
  'EDITOR',
]

// التحقق من أن المستخدم مساهم
export function isContributor(role: string): boolean {
  return CONTRIBUTOR_ROLES.includes(role as RoleName)
}

// =============================================
// 8. أدوار الإدارة - ADMIN ROLES
// =============================================
// الأدوار التي لها صلاحيات إدارية
export const ADMIN_ROLES: RoleName[] = [
  'ADMIN',
  'MODERATOR',
]

// التحقق من أن المستخدم له صلاحيات إدارية
export function hasAdminPrivileges(role: string): boolean {
  return ADMIN_ROLES.includes(role as RoleName)
}

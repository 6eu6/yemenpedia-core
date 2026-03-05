// =============================================
// Yemenpedia - Authentication Types
// =============================================

// استيراد الأدوار من ملف التكوين المركزي
import type { RoleName } from '@/config/roles.config'
import { ROLE_HIERARCHY, ROLE_PERMISSIONS, ROLE_NAMES } from '@/config/roles.config'

// نوع الدور (للتوافق مع الكود القديم)
export type Role = RoleName

// Re-export Role for convenience
export type { RoleName } from '@/config/roles.config'

// =============================================
// Session Types
// =============================================
export interface AuthUser {
  id: string
  email: string
  name: string | null
  image: string | null
  role: Role
  isVerified: boolean
  isActive: boolean
  isBanned: boolean
  preferredLang: string
}

export interface AuthSession {
  user: AuthUser
  expires: string
}

// =============================================
// Registration Types
// =============================================
export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirmPassword?: string
}

export interface RegisterResponse {
  success: boolean
  message: string
  data?: {
    userId: string
    email: string
  }
  error?: string
}

// =============================================
// Login Types
// =============================================
export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  success: boolean
  message: string
  data?: AuthUser
  error?: string
}

// =============================================
// Email Verification Types
// =============================================
export interface VerifyEmailRequest {
  token: string
}

export interface VerifyEmailResponse {
  success: boolean
  message: string
  error?: string
}

export interface SendVerificationRequest {
  email: string
}

// =============================================
// Password Reset Types
// =============================================
export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  success: boolean
  message: string
  error?: string
  details?: unknown
}

export interface ResetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
}

export interface ResetPasswordResponse {
  success: boolean
  message: string
  error?: string
  details?: unknown
}

// =============================================
// Password Validation Types
// =============================================
export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
  strength?: 'weak' | 'medium' | 'strong'
}

// =============================================
// Token Types
// =============================================
export interface VerificationTokenData {
  id: string
  email: string
  token: string
  type: 'verify_email' | 'reset_password'
  expiresAt: Date
  createdAt: Date
}

// =============================================
// OAuth Types
// =============================================
export interface OAuthAccount {
  provider: 'google' | 'facebook'
  providerAccountId: string
  userId: string
}

// =============================================
// Role Permission Types
// =============================================

// Role hierarchy for permission inheritance
export { ROLE_HIERARCHY }

// Permission definitions per role
export { ROLE_PERMISSIONS }

// =============================================
// Auth Error Types
// =============================================
export type AuthErrorType =
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'USER_ALREADY_EXISTS'
  | 'EMAIL_NOT_VERIFIED'
  | 'USER_BANNED'
  | 'USER_INACTIVE'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'PASSWORD_MISMATCH'
  | 'PASSWORD_TOO_WEAK'
  | 'INVALID_EMAIL'
  | 'INVALID_PASSWORD'

export interface AuthError {
  type: AuthErrorType
  message: string
  statusCode: number
}

export const AUTH_ERRORS: Record<AuthErrorType, AuthError> = {
  INVALID_CREDENTIALS: {
    type: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password',
    statusCode: 401,
  },
  USER_NOT_FOUND: {
    type: 'USER_NOT_FOUND',
    message: 'User not found',
    statusCode: 404,
  },
  USER_ALREADY_EXISTS: {
    type: 'USER_ALREADY_EXISTS',
    message: 'An account with this email already exists',
    statusCode: 409,
  },
  EMAIL_NOT_VERIFIED: {
    type: 'EMAIL_NOT_VERIFIED',
    message: 'Please verify your email address',
    statusCode: 403,
  },
  USER_BANNED: {
    type: 'USER_BANNED',
    message: 'Your account has been banned',
    statusCode: 403,
  },
  USER_INACTIVE: {
    type: 'USER_INACTIVE',
    message: 'Your account is inactive',
    statusCode: 403,
  },
  INVALID_TOKEN: {
    type: 'INVALID_TOKEN',
    message: 'Invalid verification token',
    statusCode: 400,
  },
  TOKEN_EXPIRED: {
    type: 'TOKEN_EXPIRED',
    message: 'Verification token has expired',
    statusCode: 400,
  },
  PASSWORD_MISMATCH: {
    type: 'PASSWORD_MISMATCH',
    message: 'Passwords do not match',
    statusCode: 400,
  },
  PASSWORD_TOO_WEAK: {
    type: 'PASSWORD_TOO_WEAK',
    message: 'Password is too weak',
    statusCode: 400,
  },
  INVALID_EMAIL: {
    type: 'INVALID_EMAIL',
    message: 'Invalid email address',
    statusCode: 400,
  },
  INVALID_PASSWORD: {
    type: 'INVALID_PASSWORD',
    message: 'Invalid password format',
    statusCode: 400,
  },
}

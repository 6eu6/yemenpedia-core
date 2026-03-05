// =============================================
// Yemenpedia - Authentication Utilities
// =============================================

import bcrypt from 'bcryptjs'
import { randomBytes, randomUUID } from 'crypto'
import { PasswordValidationResult } from '@/types/auth'

// =============================================
// Password Utilities
// =============================================

const SALT_ROUNDS = 12

/**
 * Hash a plain text password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS)
  return bcrypt.hash(password, salt)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []
  let strength: 'weak' | 'medium' | 'strong' = 'weak'

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  // Calculate strength
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  const hasLength = password.length >= 12

  const criteriaCount = [hasLower, hasUpper, hasNumber, hasSpecial, hasLength].filter(Boolean).length

  if (errors.length === 0) {
    strength = criteriaCount >= 4 ? 'strong' : 'medium'
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
  }
}

// =============================================
// Email Utilities
// =============================================

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Normalize email address (lowercase, trim)
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

// =============================================
// Token Utilities
// =============================================

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex')
}

/**
 * Generate a UUID v4 token
 */
export function generateUUID(): string {
  return randomUUID()
}

/**
 * Generate a verification token with expiration
 */
export function generateVerificationToken(): {
  token: string
  expiresAt: Date
} {
  const token = generateToken(32)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  return { token, expiresAt }
}

/**
 * Generate a password reset token with expiration
 */
export function generatePasswordResetToken(): {
  token: string
  expiresAt: Date
} {
  const token = generateToken(32)
  const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour

  return { token, expiresAt }
}

// =============================================
// Name Utilities
// =============================================

/**
 * Validate user name
 */
export function validateName(name: string): { valid: boolean; error?: string } {
  const trimmedName = name.trim()

  if (trimmedName.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters long' }
  }

  if (trimmedName.length > 100) {
    return { valid: false, error: 'Name must be less than 100 characters' }
  }

  // Only allow letters, spaces, and common name characters
  if (!/^[\p{L}\s\-']+$/u.test(trimmedName)) {
    return { valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' }
  }

  return { valid: true }
}

// =============================================
// Permission Utilities
// =============================================

import { UserRole, ROLE_HIERARCHY, ROLE_PERMISSIONS } from '@/types/auth'

/**
 * Check if a user has a specific permission
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || []
  return permissions.includes(permission) || permissions.includes('write:all') || permissions.includes('read:all')
}

/**
 * Check if a user has at least the specified role level
 */
export function hasRoleLevel(userRole: UserRole, requiredRole: UserRole): boolean {
  const userLevel = ROLE_HIERARCHY.indexOf(userRole)
  const requiredLevel = ROLE_HIERARCHY.indexOf(requiredRole)
  return userLevel >= requiredLevel
}

/**
 * Get all permissions for a role (including inherited)
 */
export function getRolePermissions(role: UserRole): string[] {
  const roleIndex = ROLE_HIERARCHY.indexOf(role)
  const permissions: Set<string> = new Set()

  // Get permissions for this role and all roles below it in hierarchy
  for (let i = 0; i <= roleIndex; i++) {
    const rolePermissions = ROLE_PERMISSIONS[ROLE_HIERARCHY[i]] || []
    rolePermissions.forEach(p => permissions.add(p))
  }

  return Array.from(permissions)
}

// =============================================
// Session Utilities
// =============================================

/**
 * Check if session is expired
 */
export function isSessionExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}

/**
 * Get session expiration time (default 30 days for "remember me", 1 day otherwise)
 */
export function getSessionExpiration(rememberMe: boolean = false): Date {
  const days = rememberMe ? 30 : 1
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

// =============================================
// Rate Limiting Utilities (Simple in-memory)
// =============================================

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Simple rate limiter
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remainingAttempts: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    // Create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    })
    return { allowed: true, remainingAttempts: maxAttempts - 1, resetAt: now + windowMs }
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, remainingAttempts: 0, resetAt: entry.resetAt }
  }

  // Increment count
  entry.count++
  return {
    allowed: true,
    remainingAttempts: maxAttempts - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Clear rate limit for a key
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key)
}

// =============================================
// Cleanup Utilities
// =============================================

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimits(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000)
}

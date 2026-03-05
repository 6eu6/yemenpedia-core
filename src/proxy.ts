/**
 * Next.js 16 Native Proxy
 * 
 * This proxy handles:
 * 1. Locale detection and redirection
 * 2. Authentication header management
 * 3. Internationalization routing
 * 4. Security headers
 * 5. CORS for API routes
 * 
 * No wrappers, no patches - pure Next.js 16 proxy implementation.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ============================================
// Configuration
// ============================================

const LOCALES = ['ar', 'en'] as const
const DEFAULT_LOCALE = 'ar'
const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'
const LOCALE_HEADER_NAME = 'x-locale'

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://yemenpedia.org',
  'https://www.yemenpedia.org',
  process.env.NEXTAUTH_URL,
].filter(Boolean) as string[]

// Security headers
const SECURITY_HEADERS: Record<string, string> = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // XSS Protection
  'X-XSS-Protection': '1; mode=block',
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Permissions Policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

// Matcher patterns for proxy
export const config = {
  matcher: [
    // Match root
    '/',
    // Match locale-prefixed routes
    '/(ar|en)/:path*',
    // Match all routes except static files
    '/((?!_next|_vercel|favicon|logo|.*\\..*).*)',
  ],
}

// ============================================
// Locale Detection
// ============================================

function getLocaleFromPathname(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]
  
  if (firstSegment && LOCALES.includes(firstSegment as typeof LOCALES[number])) {
    return firstSegment
  }
  
  return null
}

function getLocaleFromCookie(request: NextRequest): string | null {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value
  if (cookieLocale && LOCALES.includes(cookieLocale as typeof LOCALES[number])) {
    return cookieLocale
  }
  return null
}

function getLocaleFromHeader(request: NextRequest): string | null {
  const acceptLanguage = request.headers.get('accept-language')
  if (!acceptLanguage) return null
  
  // Parse accept-language header
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, q] = lang.trim().split(';')
      const quality = q ? parseFloat(q.replace('q=', '')) : 1
      return { code: code?.split('-')[0]?.toLowerCase(), quality }
    })
    .filter(lang => lang.code)
    .sort((a, b) => b.quality - a.quality)
  
  // Find first matching locale
  for (const lang of languages) {
    if (lang.code && LOCALES.includes(lang.code as typeof LOCALES[number])) {
      return lang.code
    }
  }
  
  return null
}

function resolveLocale(request: NextRequest, pathnameLocale: string | null): string {
  // Priority: pathname > cookie > header > default
  if (pathnameLocale) return pathnameLocale
  
  const cookieLocale = getLocaleFromCookie(request)
  if (cookieLocale) return cookieLocale
  
  const headerLocale = getLocaleFromHeader(request)
  if (headerLocale) return headerLocale
  
  return DEFAULT_LOCALE
}

// ============================================
// Header Management
// ============================================

function mergeHeaders(
  request: NextRequest,
  locale: string,
  existingHeaders?: Headers
): Headers {
  const headers = existingHeaders || new Headers(request.headers)
  
  // Set locale header for i18n
  headers.set(LOCALE_HEADER_NAME, locale)
  
  // Preserve authentication headers
  const authHeaders = [
    'authorization',
    'cookie',
    'x-auth-token',
    'x-session-id',
  ]
  
  for (const header of authHeaders) {
    const value = request.headers.get(header)
    if (value && !headers.has(header)) {
      headers.set(header, value)
    }
  }
  
  return headers
}

// ============================================
// CORS Handler for API Routes
// ============================================

function handleCors(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get('origin') || ''
  
  // Check if origin is allowed
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || 
                    ALLOWED_ORIGINS.some(allowed => origin.endsWith(allowed.replace('https://', '').replace('http://', '')))
  
  if (isAllowed || !origin) {
    response.headers.set('Access-Control-Allow-Origin', origin || ALLOWED_ORIGINS[0])
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400')
  }
  
  return response
}

// ============================================
// Main Proxy Handler
// ============================================

export default function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl
  
  // Handle API routes with CORS
  if (pathname.startsWith('/api')) {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 })
      handleCors(request, response)
      
      // Add security headers
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      
      return response
    }
    
    const response = NextResponse.next()
    handleCors(request, response)
    
    // Add security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response
  }
  
  // Skip static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') // Skip files with extensions
  ) {
    return NextResponse.next()
  }
  
  // Detect locale from pathname
  const pathnameLocale = getLocaleFromPathname(pathname)
  
  // Resolve the effective locale
  const locale = resolveLocale(request, pathnameLocale)
  
  // Build the response
  let response: NextResponse
  
  // Case 1: Root path - redirect to default locale
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}`
    
    response = NextResponse.redirect(url)
    
    // Set locale cookie
    response.cookies.set(LOCALE_COOKIE_NAME, locale, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })
    
    // Add security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response
  }
  
  // Case 2: Already has locale prefix - rewrite to continue
  if (pathnameLocale) {
    const headers = mergeHeaders(request, locale)
    
    response = NextResponse.next({
      request: {
        headers,
      },
    })
    
    // Add security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response
  }
  
  // Case 3: No locale prefix - redirect to add locale
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname}`
  
  response = NextResponse.redirect(url)
  
  // Set locale cookie
  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })
  
  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

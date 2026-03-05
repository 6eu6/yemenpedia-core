// =============================================
// Yemenpedia - Forgot Password API Route
// =============================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { normalizeEmail, checkRateLimit } from '@/lib/auth-utils'
import { forgotPasswordSchema } from '@/lib/validations'
import { ForgotPasswordResponse } from '@/types/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body with Zod
    const validation = forgotPasswordSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json<ForgotPasswordResponse>(
        {
          success: false,
          message: 'البيانات غير صالحة',
          error: 'VALIDATION_ERROR',
          details: validation.error.flatten(),
        },
        { status: 400 }
      )
    }
    
    const { email } = validation.data

    // Rate limiting based on IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const rateLimitKey = `forgot-password:${ip}`
    const rateLimit = checkRateLimit(rateLimitKey, 3, 60 * 60 * 1000) // 3 attempts per hour

    if (!rateLimit.allowed) {
      return NextResponse.json<ForgotPasswordResponse>(
        {
          success: false,
          message: 'عدد المحاولات تجاوز الحد المسموح. يرجى المحاولة لاحقاً',
          error: 'RATE_LIMITED',
        },
        { status: 429 }
      )
    }

    const normalizedEmail = normalizeEmail(email)

    // Find user
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json<ForgotPasswordResponse>(
        {
          success: true,
          message: 'إذا كان البريد مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور',
        },
        { status: 200 }
      )
    }

    // Check if user has a password (OAuth users might not)
    if (!user.password) {
      // User registered via OAuth
      return NextResponse.json<ForgotPasswordResponse>(
        {
          success: true,
          message: 'إذا كان البريد مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور',
        },
        { status: 200 }
      )
    }

    // Delete any existing password reset tokens for this email
    await db.verificationToken.deleteMany({
      where: {
        email: normalizedEmail,
        type: 'reset_password',
      },
    })

    // Generate new reset token
    const token = crypto.randomUUID().replace(/-/g, '')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Create reset token
    await db.verificationToken.create({
      data: {
        email: normalizedEmail,
        token,
        type: 'reset_password',
        expiresAt,
      },
    })

    // TODO: Send password reset email
    // For now, we'll just log it
    console.log(`
      Password reset email for ${normalizedEmail}:
      Token: ${token}
      Link: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}
    `)

    return NextResponse.json<ForgotPasswordResponse>(
      {
        success: true,
        message: 'إذا كان البريد مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json<ForgotPasswordResponse>(
      {
        success: false,
        message: 'حدث خطأ. يرجى المحاولة لاحقاً',
        error: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

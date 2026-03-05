// =============================================
// Yemenpedia - Reset Password API Route
// =============================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, checkRateLimit } from '@/lib/auth-utils'
import { resetPasswordSchema } from '@/lib/validations'
import { ResetPasswordResponse } from '@/types/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body with Zod
    const validation = resetPasswordSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json<ResetPasswordResponse>(
        {
          success: false,
          message: 'البيانات غير صالحة',
          error: 'VALIDATION_ERROR',
          details: validation.error.flatten(),
        },
        { status: 400 }
      )
    }
    
    const { token, password } = validation.data

    // Rate limiting based on IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const rateLimitKey = `reset-password:${ip}`
    const rateLimit = checkRateLimit(rateLimitKey, 5, 60 * 60 * 1000) // 5 attempts per hour

    if (!rateLimit.allowed) {
      return NextResponse.json<ResetPasswordResponse>(
        {
          success: false,
          message: 'عدد المحاولات تجاوز الحد المسموح. يرجى المحاولة لاحقاً',
          error: 'RATE_LIMITED',
        },
        { status: 429 }
      )
    }

    // Find the reset token
    const resetToken = await db.verificationToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return NextResponse.json<ResetPasswordResponse>(
        {
          success: false,
          message: 'رمز إعادة التعيين غير صالح',
          error: 'INVALID_TOKEN',
        },
        { status: 400 }
      )
    }

    // Check if token is for password reset
    if (resetToken.type !== 'reset_password') {
      return NextResponse.json<ResetPasswordResponse>(
        {
          success: false,
          message: 'نوع الرمز غير صالح',
          error: 'INVALID_TOKEN_TYPE',
        },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (new Date() > resetToken.expiresAt) {
      // Delete expired token
      await db.verificationToken.delete({
        where: { id: resetToken.id },
      })

      return NextResponse.json<ResetPasswordResponse>(
        {
          success: false,
          message: 'انتهت صلاحية رمز إعادة التعيين. يرجى طلب رمز جديد',
          error: 'TOKEN_EXPIRED',
        },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: resetToken.email },
    })

    if (!user) {
      return NextResponse.json<ResetPasswordResponse>(
        {
          success: false,
          message: 'المستخدم غير موجود',
          error: 'USER_NOT_FOUND',
        },
        { status: 404 }
      )
    }

    // Hash new password
    const hashedPassword = await hashPassword(password)

    // Update user password
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    })

    // Delete the used token
    await db.verificationToken.delete({
      where: { id: resetToken.id },
    })

    // Delete all other password reset tokens for this user
    await db.verificationToken.deleteMany({
      where: {
        email: user.email,
        type: 'reset_password',
      },
    })

    // Create notification
    await db.notification.create({
      data: {
        userId: user.id,
        type: 'SYSTEM',
        title: 'تم تغيير كلمة المرور',
        message: 'تم تغيير كلمة المرور الخاصة بحسابك بنجاح. إذا لم تكن أنت من قام بهذا التغيير، يرجى التواصل مع الإدارة فوراً.',
      },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'password_reset',
        entityType: 'user',
        entityId: user.id,
        ipAddress: ip,
      },
    })

    return NextResponse.json<ResetPasswordResponse>(
      {
        success: true,
        message: 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json<ResetPasswordResponse>(
      {
        success: false,
        message: 'حدث خطأ أثناء إعادة تعيين كلمة المرور. يرجى المحاولة لاحقاً',
        error: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

// Verify reset token validity
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'الرمز مطلوب',
          valid: false,
        },
        { status: 400 }
      )
    }

    // Find the reset token
    const resetToken = await db.verificationToken.findUnique({
      where: { token },
    })

    if (!resetToken || resetToken.type !== 'reset_password') {
      return NextResponse.json(
        {
          success: false,
          message: 'الرمز غير صالح',
          valid: false,
        },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        {
          success: false,
          message: 'انتهت صلاحية الرمز',
          valid: false,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        valid: true,
        email: resetToken.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Masked email
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'حدث خطأ',
        valid: false,
      },
      { status: 500 }
    )
  }
}

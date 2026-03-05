// =============================================
// Yemenpedia - Email Verification API Route
// =============================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { VerifyEmailResponse } from '@/types/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json<VerifyEmailResponse>(
        {
          success: false,
          message: 'رمز التحقق مطلوب',
          error: 'TOKEN_REQUIRED',
        },
        { status: 400 }
      )
    }

    // Find the verification token
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
    })

    if (!verificationToken) {
      return NextResponse.json<VerifyEmailResponse>(
        {
          success: false,
          message: 'رمز التحقق غير صالح',
          error: 'INVALID_TOKEN',
        },
        { status: 400 }
      )
    }

    // Check if token is for email verification
    if (verificationToken.type !== 'verify_email') {
      return NextResponse.json<VerifyEmailResponse>(
        {
          success: false,
          message: 'نوع الرمز غير صالح',
          error: 'INVALID_TOKEN_TYPE',
        },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (new Date() > verificationToken.expiresAt) {
      // Delete expired token
      await db.verificationToken.delete({
        where: { id: verificationToken.id },
      })

      return NextResponse.json<VerifyEmailResponse>(
        {
          success: false,
          message: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد',
          error: 'TOKEN_EXPIRED',
        },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: verificationToken.email },
    })

    if (!user) {
      return NextResponse.json<VerifyEmailResponse>(
        {
          success: false,
          message: 'المستخدم غير موجود',
          error: 'USER_NOT_FOUND',
        },
        { status: 404 }
      )
    }

    // Check if already verified
    if (user.isVerified) {
      // Delete the token
      await db.verificationToken.delete({
        where: { id: verificationToken.id },
      })

      return NextResponse.json<VerifyEmailResponse>(
        {
          success: true,
          message: 'تم التحقق من البريد الإلكتروني مسبقاً',
        },
        { status: 200 }
      )
    }

    // Update user as verified
    await db.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        emailVerifiedAt: new Date(),
      },
    })

    // Delete the used token
    await db.verificationToken.delete({
      where: { id: verificationToken.id },
    })

    // Create welcome notification
    await db.notification.create({
      data: {
        userId: user.id,
        type: 'WELCOME',
        title: 'مرحباً بك في اليمنبيديا',
        message: 'شكراً لانضمامك إلى الموسوعة اليمنية. يمكنك الآن البدء في استكشاف المحتوى والمشاركة فيه.',
      },
    })

    return NextResponse.json<VerifyEmailResponse>(
      {
        success: true,
        message: 'تم التحقق من بريدك الإلكتروني بنجاح',
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json<VerifyEmailResponse>(
      {
        success: false,
        message: 'حدث خطأ أثناء التحقق. يرجى المحاولة لاحقاً',
        error: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

// Resend verification email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json<VerifyEmailResponse>(
        {
          success: false,
          message: 'البريد الإلكتروني مطلوب',
          error: 'EMAIL_REQUIRED',
        },
        { status: 400 }
      )
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json<VerifyEmailResponse>(
        {
          success: true,
          message: 'إذا كان البريد مسجلاً، ستصلك رسالة تحقق',
        },
        { status: 200 }
      )
    }

    // Check if already verified
    if (user.isVerified) {
      return NextResponse.json<VerifyEmailResponse>(
        {
          success: true,
          message: 'تم التحقق من البريد الإلكتروني مسبقاً',
        },
        { status: 200 }
      )
    }

    // Delete any existing verification tokens for this email
    await db.verificationToken.deleteMany({
      where: {
        email: email.toLowerCase(),
        type: 'verify_email',
      },
    })

    // Generate new verification token
    const { token, expiresAt } = {
      token: crypto.randomUUID().replace(/-/g, ''),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    }

    // Create new verification token
    await db.verificationToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        type: 'verify_email',
        expiresAt,
      },
    })

    // TODO: Send verification email

    return NextResponse.json<VerifyEmailResponse>(
      {
        success: true,
        message: 'إذا كان البريد مسجلاً، ستصلك رسالة تحقق',
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json<VerifyEmailResponse>(
      {
        success: false,
        message: 'حدث خطأ. يرجى المحاولة لاحقاً',
        error: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

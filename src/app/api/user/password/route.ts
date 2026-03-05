/**
 * User Password Change API - SECURED
 * 
 * Security Fixes Applied:
 * 1. userId is taken from session, NOT from request body
 * 2. Only the authenticated user can change their own password
 * 3. Admins can change any user's password (for account recovery)
 */

import { NextRequest, NextResponse } from 'next/server'
import { compare, hash } from 'bcryptjs'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getAuthUser, isAdmin } from '@/lib/session'

// Regular user password change (requires current password)
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newPassword: z.string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'كلمة المرور يجب أن تحتوي على حرف كبير')
    .regex(/[a-z]/, 'كلمة المرور يجب أن تحتوي على حرف صغير')
    .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي على رقم'),
})

// Admin password reset (target userId specified)
const adminResetSchema = z.object({
  targetUserId: z.string(),
  newPassword: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
})

export async function PUT(request: NextRequest) {
  try {
    // SECURITY: Get user from session
    const auth = await getAuthUser(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode })
    }

    const userId = auth.user.id
    const userRole = auth.user.role
    const body = await request.json()

    // Check if this is an admin reset
    if (body.targetUserId && isAdmin(userRole)) {
      const validatedData = adminResetSchema.parse(body)
      
      // Hash new password
      const hashedPassword = await hash(validatedData.newPassword, 12)
      
      // Update password
      await db.user.update({
        where: { id: validatedData.targetUserId },
        data: { password: hashedPassword }
      })

      return NextResponse.json({
        success: true,
        message: 'تم إعادة تعيين كلمة المرور بنجاح'
      })
    }

    // Regular password change - validate with current password
    const validatedData = changePasswordSchema.parse(body)

    // Get user with password
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    // Check if user has a password (OAuth users might not)
    if (!user.password) {
      return NextResponse.json({ 
        error: 'هذا الحساب يستخدم تسجيل الدخول الاجتماعي' 
      }, { status: 400 })
    }

    // Verify current password
    const isPasswordValid = await compare(validatedData.currentPassword, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await hash(validatedData.newPassword, 12)

    // Update password
    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: error.issues[0].message 
      }, { status: 400 })
    }
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء تغيير كلمة المرور' 
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { compare, hash } from 'bcryptjs'
import { z } from 'zod'

const prisma = new PrismaClient()

const changePasswordSchema = z.object({
  userId: z.string(),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
})

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = changePasswordSchema.parse(body)

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId }
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
    await prisma.user.update({
      where: { id: validatedData.userId },
      data: { password: hashedPassword }
    })

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Change password error:', error)
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء تغيير كلمة المرور' 
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

// Create a fresh Prisma client instance to avoid cache issues
const prisma = new PrismaClient()

const updateUsernameSchema = z.object({
  userId: z.string(),
  username: z.string()
    .min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل')
    .max(30, 'اسم المستخدم طويل جداً')
    .regex(/^[a-z0-9_]+$/, 'اسم المستخدم يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام و _ فقط')
})

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = updateUsernameSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: validatedData.userId }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    // Check if username is taken by another user
    const existingUsername = await prisma.user.findFirst({
      where: {
        username: validatedData.username,
        NOT: { id: validatedData.userId }
      }
    })

    if (existingUsername) {
      return NextResponse.json({ error: 'اسم المستخدم محجوز بالفعل' }, { status: 400 })
    }

    // Update username
    const updatedUser = await prisma.user.update({
      where: { id: validatedData.userId },
      data: { username: validatedData.username }
    })

    return NextResponse.json({
      success: true,
      message: 'تم تحديث اسم المستخدم',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        image: updatedUser.image,
        bio: updatedUser.bio,
        location: updatedUser.location,
        website: updatedUser.website,
        socialLinks: updatedUser.socialLinks,
        points: updatedUser.points
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء تحديث اسم المستخدم',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

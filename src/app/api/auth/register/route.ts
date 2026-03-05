import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  username: z.string()
    .min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل')
    .max(30, 'اسم المستخدم طويل جداً')
    .regex(/^[a-z0-9_]+$/, 'اسم المستخدم يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام و_ فقط'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = registerSchema.parse(body)
    
    // Check if email already exists
    const existingEmail = await db.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (existingEmail) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUsername = await db.user.findUnique({
      where: { username: validatedData.username }
    })
    
    if (existingUsername) {
      return NextResponse.json(
        { error: 'اسم المستخدم محجوز بالفعل' },
        { status: 400 }
      )
    }
    
    // Hash password
    const hashedPassword = await hash(validatedData.password, 12)
    
    // Create user
    const user = await db.user.create({
      data: {
        name: validatedData.name,
        username: validatedData.username,
        email: validatedData.email,
        password: hashedPassword,
        role: 'WRITER',
        isVerified: false,
        points: 0
      }
    })
    
    // Create welcome notification
    await db.notification.create({
      data: {
        userId: user.id,
        type: 'WELCOME',
        title: 'مرحباً بك في يمنبيديا!',
        message: 'شكراً لانضمامك إلى موسوعة اليمن الوطنية. يمكنك الآن البدء في كتابة المقالات.'
      }
    })
    
    // Award Pioneer badge to first 100 users
    const userCount = await db.user.count()
    if (userCount <= 100) {
      await db.userBadge.create({
        data: {
          userId: user.id,
          badgeType: 'PIONEER'
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الحساب' },
      { status: 500 }
    )
  }
}

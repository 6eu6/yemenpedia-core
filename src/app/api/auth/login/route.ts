import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { compare } from 'bcryptjs'
import { z } from 'zod'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limiter'
import { randomBytes } from 'crypto'

// Login can be with email OR username
const loginSchema = z.object({
  identifier: z.string().min(1, 'البريد أو اسم المستخدم مطلوب'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
  remember: z.boolean().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request)
    const rateLimitKey = `login:${clientIP}`
    const rateCheck = checkRateLimit(rateLimitKey, RATE_LIMITS.LOGIN)
    
    if (!rateCheck.allowed) {
      const resetMinutes = Math.ceil((rateCheck.resetAt - Date.now()) / 60000)
      return NextResponse.json(
        { error: `تم تجاوز عدد محاولات تسجيل الدخول. يرجى المحاولة بعد ${resetMinutes} دقيقة` },
        { status: 429 }
      )
    }

    const body = await request.json()
    const validatedData = loginSchema.parse(body)
    
    // Check if identifier is email or username
    const isEmail = validatedData.identifier.includes('@')
    
    // Find user by email OR username
    const user = await db.user.findFirst({
      where: isEmail 
        ? { email: validatedData.identifier.toLowerCase() }
        : { username: validatedData.identifier.toLowerCase() }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'بيانات الدخول غير صحيحة' },
        { status: 401 }
      )
    }
    
    if (user.isBanned) {
      return NextResponse.json(
        { error: 'تم حظر حسابك. يرجى التواصل مع الإدارة' },
        { status: 403 }
      )
    }
    
    if (!user.password) {
      return NextResponse.json(
        { error: 'يرجى تسجيل الدخول باستخدام Google' },
        { status: 401 }
      )
    }
    
    const isPasswordValid = await compare(validatedData.password, user.password)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'بيانات الدخول غير صحيحة' },
        { status: 401 }
      )
    }
    
    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        image: user.image,
        points: user.points,
        isVerified: user.isVerified,
        bio: user.bio,
        location: user.location,
        website: user.website
      }
    })
    
    // Set session cookie with CSRF token
    const maxAge = validatedData.remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7
    const csrfToken = randomBytes(32).toString('hex')
    
    // SECURITY: Use 'lax' instead of 'none' to prevent CSRF attacks
    response.cookies.set('session', JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name,
      csrfToken,
      createdAt: Date.now()
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from 'none' to 'lax' for CSRF protection
      maxAge,
      path: '/'
    })
    
    return response
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الدخول' },
      { status: 500 }
    )
  }
}

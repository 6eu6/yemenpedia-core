import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { usernameCheckSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    const excludeUserId = searchParams.get('excludeUserId') ?? undefined

    // Validate query parameters with Zod
    const validation = usernameCheckSchema.safeParse({ username, excludeUserId })

    if (!validation.success) {
      return NextResponse.json(
        { 
          available: false, 
          error: 'Validation failed',
          details: validation.error.flatten() 
        },
        { status: 400 }
      )
    }

    const { username: validatedUsername, excludeUserId: validatedExcludeUserId } = validation.data

    // Check if username exists (excluding current user if provided)
    const existingUser = await db.user.findFirst({
      where: {
        username: validatedUsername.toLowerCase(),
        NOT: validatedExcludeUserId ? { id: validatedExcludeUserId } : undefined
      }
    })

    return NextResponse.json({
      available: !existingUser
    })
  } catch (error) {
    console.error('Check username error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

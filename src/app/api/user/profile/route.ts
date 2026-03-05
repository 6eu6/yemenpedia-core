/**
 * User Profile API
 * 
 * SECURITY: Users can only update their own profile
 * Admins can update any profile
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { profileUpdateSchema, profileQuerySchema } from '@/lib/validations'
import { getAuthUser } from '@/lib/session'
import { hasAdminPrivileges, type RoleName } from '@/config/roles.config'

export async function PUT(request: NextRequest) {
  try {
    // SECURITY: Authenticate user first
    const auth = await getAuthUser(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode })
    }

    const body = await request.json()
    
    // Validate request body with Zod
    const validation = profileUpdateSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'البيانات غير صالحة',
          details: validation.error.flatten() 
        },
        { status: 400 }
      )
    }
    
    const { userId, ...updateData } = validation.data

    // SECURITY: Check authorization - users can only update their own profile
    // Admins can update any profile
    const isOwnProfile = userId === auth.user.id
    const isAdminUser = hasAdminPrivileges(auth.user.role)
    
    if (!isOwnProfile && !isAdminUser) {
      return NextResponse.json({ 
        error: 'غير مصرح لك بتعديل هذا الملف الشخصي' 
      }, { status: 403 })
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    // Build update data - only include fields that are provided
    const data: Record<string, unknown> = {}
    
    if ('name' in updateData && updateData.name !== undefined) data.name = updateData.name || null
    if ('bio' in updateData && updateData.bio !== undefined) data.bio = updateData.bio || null
    if ('location' in updateData && updateData.location !== undefined) data.location = updateData.location || null
    if ('website' in updateData && updateData.website !== undefined) data.website = updateData.website || null
    if ('image' in updateData && updateData.image !== undefined) data.image = updateData.image || null
    if ('coverImage' in updateData && updateData.coverImage !== undefined) data.coverImage = updateData.coverImage || null
    if ('socialLinks' in updateData && updateData.socialLinks !== undefined) data.socialLinks = updateData.socialLinks

    // Only update if there's data to update
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'لا توجد تغييرات للحفظ',
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          bio: user.bio,
          location: user.location,
          website: user.website,
          image: user.image,
          coverImage: user.coverImage,
          socialLinks: user.socialLinks,
          points: user.points
        }
      })
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data
    })

    return NextResponse.json({
      success: true,
      message: 'تم تحديث الملف الشخصي',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        bio: updatedUser.bio,
        location: updatedUser.location,
        website: updatedUser.website,
        image: updatedUser.image,
        coverImage: updatedUser.coverImage,
        socialLinks: updatedUser.socialLinks,
        points: updatedUser.points
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء تحديث الملف',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

// GET endpoint to fetch user profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') ?? undefined

    // Validate query parameters with Zod
    const validation = profileQuerySchema.safeParse({ userId })

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'البيانات غير صالحة',
          details: validation.error.flatten() 
        },
        { status: 400 }
      )
    }

    const { userId: validatedUserId } = validation.data

    const user = await db.user.findUnique({
      where: { id: validatedUserId }
    })

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    return NextResponse.json({ 
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        bio: user.bio,
        location: user.location,
        website: user.website,
        image: user.image,
        coverImage: user.coverImage,
        socialLinks: user.socialLinks,
        points: user.points,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الملف الشخصي' }, { status: 500 })
  }
}

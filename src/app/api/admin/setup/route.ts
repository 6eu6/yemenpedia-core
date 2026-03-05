import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'

export async function GET() {
  try {
    // Check existing users
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isVerified: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({
      count: users.length,
      users: users
    })
  } catch (error) {
    console.error('Error checking users:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST() {
  try {
    // Check if admin already exists
    const existingAdmin = await db.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      // Reset password for existing admin
      const hashedPassword = await hash('admin123456', 12)
      await db.user.update({
        where: { id: existingAdmin.id },
        data: {
          password: hashedPassword,
          isVerified: true
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Admin password reset successfully',
        user: {
          id: existingAdmin.id,
          email: existingAdmin.email,
          username: existingAdmin.username,
          role: existingAdmin.role
        },
        credentials: {
          email: existingAdmin.email,
          username: existingAdmin.username,
          password: 'admin123456'
        }
      })
    }

    // Create admin account
    const hashedPassword = await hash('admin123456', 12)

    const admin = await db.user.create({
      data: {
        name: 'مدير النظام',
        username: 'admin',
        email: 'admin@yemenpedia.org',
        password: hashedPassword,
        role: 'ADMIN',
        isVerified: true,
        points: 0
      }
    })

    // Create welcome notification
    await db.notification.create({
      data: {
        userId: admin.id,
        type: 'WELCOME',
        title: 'مرحباً بك في يمنبيديا!',
        message: 'تم إنشاء حساب المدير بنجاح. يمكنك الآن إدارة الموسوعة.'
      }
    })

    // Award Pioneer badge
    await db.userBadge.create({
      data: {
        userId: admin.id,
        badgeType: 'PIONEER'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      user: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        name: admin.name,
        role: admin.role
      },
      credentials: {
        email: 'admin@yemenpedia.org',
        password: 'admin123456'
      }
    })
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 })
  }
}

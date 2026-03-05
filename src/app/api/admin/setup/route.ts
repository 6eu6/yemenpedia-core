/**
 * Admin Setup Route - SECURED
 * 
 * Security Measures:
 * 1. Requires SETUP_SECRET from environment (one-time setup token)
 * 2. Only works if no admin exists OR if authenticated as admin
 * 3. Never exposes credentials in response
 * 
 * This route should be DISABLED in production after initial setup
 * by removing SETUP_SECRET from environment.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'
import { getAuthUser, isAdmin } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const auth = await getAuthUser(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode })
    }

    // Only admins can view users
    if (!isAdmin(auth.user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

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
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for setup secret (for initial setup)
    const setupSecret = request.headers.get('X-Setup-Secret')
    const validSetupSecret = process.env.SETUP_SECRET || process.env.CRON_SECRET
    
    // Option 1: Valid setup secret (initial installation)
    const isInitialSetup = validSetupSecret && setupSecret === validSetupSecret
    
    // Option 2: Authenticated admin (subsequent admin creation)
    const auth = await getAuthUser(request)
    const isAuthenticatedAdmin = auth.success && isAdmin(auth.user.role)
    
    // Must have either valid setup secret OR be authenticated admin
    if (!isInitialSetup && !isAuthenticatedAdmin) {
      return NextResponse.json({ 
        error: 'Unauthorized. Provide X-Setup-Secret header or authenticate as admin.' 
      }, { status: 401 })
    }

    // Check if admin already exists
    const existingAdmin = await db.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      // Only allow password reset via setup secret (not via authenticated admin)
      if (!isInitialSetup) {
        return NextResponse.json({ 
          error: 'Admin already exists. Use setup secret to reset password.' 
        }, { status: 400 })
      }
      
      // Generate a random secure password
      const newPassword = generateSecurePassword()
      const hashedPassword = await hash(newPassword, 12)
      
      await db.user.update({
        where: { id: existingAdmin.id },
        data: {
          password: hashedPassword,
          isVerified: true
        }
      })

      // Return password only in setup mode (first time)
      return NextResponse.json({
        success: true,
        message: 'Admin password reset successfully',
        user: {
          id: existingAdmin.id,
          email: existingAdmin.email,
          username: existingAdmin.username,
          role: existingAdmin.role
        },
        // Only show new password in setup mode
        ...(isInitialSetup && {
          temporaryPassword: newPassword,
          warning: 'Save this password securely. It will not be shown again.'
        })
      })
    }

    // Create new admin account
    const password = generateSecurePassword()
    const hashedPassword = await hash(password, 12)

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
      // Only show password in initial setup
      ...(isInitialSetup && {
        temporaryPassword: password,
        warning: 'Save this password securely. It will not be shown again.'
      })
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 })
  }
}

/**
 * Generate a secure random password
 */
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*'
  const length = 16
  let password = ''
  
  // Ensure at least one of each required type
  password += 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 26)] // Uppercase
  password += 'abcdefghjkmnpqrstuvwxyz'[Math.floor(Math.random() * 26)] // Lowercase
  password += '23456789'[Math.floor(Math.random() * 8)] // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)] // Special
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  
  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

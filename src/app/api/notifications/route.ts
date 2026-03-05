/**
 * Notifications API - SECURED
 * 
 * Security Fixes Applied:
 * 1. userId is taken from session, NOT from query params/body
 * 2. Users can only read their own notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'

// Get notifications for current user
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Get user from session
    const auth = await getAuthUser(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode })
    }
    
    const userId = auth.user.id // Use session user ID

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = { userId }
    if (unreadOnly) where.isRead = false

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    const unreadCount = await db.notification.count({
      where: { userId, isRead: false }
    })

    return NextResponse.json({
      notifications,
      unreadCount
    })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    // SECURITY: Get user from session
    const auth = await getAuthUser(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode })
    }
    
    const userId = auth.user.id

    const body = await request.json()
    const { notificationId, markAllRead } = body

    if (markAllRead) {
      // SECURITY: Can only mark own notifications as read
      await db.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() }
      })
      return NextResponse.json({ success: true, message: 'تم تحديد الكل كمقروء' })
    }

    if (notificationId) {
      // SECURITY: Verify notification belongs to this user
      const notification = await db.notification.findUnique({
        where: { id: notificationId }
      })

      if (!notification) {
        return NextResponse.json({ error: 'الإشعار غير موجود' }, { status: 404 })
      }

      if (notification.userId !== userId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
      }

      await db.notification.update({
        where: { id: notificationId },
        data: { isRead: true, readAt: new Date() }
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// Delete notification
export async function DELETE(request: NextRequest) {
  try {
    // SECURITY: Get user from session
    const auth = await getAuthUser(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode })
    }
    
    const userId = auth.user.id

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('notificationId')

    if (!notificationId) {
      return NextResponse.json({ error: 'معرف الإشعار مطلوب' }, { status: 400 })
    }

    // SECURITY: Verify notification belongs to this user
    const notification = await db.notification.findUnique({
      where: { id: notificationId }
    })

    if (!notification) {
      return NextResponse.json({ error: 'الإشعار غير موجود' }, { status: 404 })
    }

    if (notification.userId !== userId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    await db.notification.delete({
      where: { id: notificationId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

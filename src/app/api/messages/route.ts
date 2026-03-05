/**
 * Messages API - SECURED
 * 
 * Security Fixes Applied:
 * 1. userId and senderId are taken from session, NOT from request body/params
 * 2. Only authenticated users can send/read messages
 * 3. Users can only read their own messages
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { getAuthUser } from '@/lib/session'

const sendMessageSchema = z.object({
  receiverId: z.string(),
  subject: z.string().optional(),
  content: z.string().min(1, 'المحتوى مطلوب')
})

const markReadSchema = z.object({
  messageId: z.string()
})

// Get messages for current user
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Get user from session
    const auth = await getAuthUser(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode })
    }
    
    const userId = auth.user.id // Use session user ID

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'inbox'
    const limit = parseInt(searchParams.get('limit') || '20')

    const messages = await db.message.findMany({
      where: type === 'inbox' 
        ? { receiverId: userId, isDeleted: false }
        : { senderId: userId },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    const unreadCount = await db.message.count({
      where: { receiverId: userId, isRead: false, isDeleted: false }
    })

    return NextResponse.json({
      messages,
      unreadCount
    })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// Send a message
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Get sender from session
    const auth = await getAuthUser(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode })
    }
    
    const senderId = auth.user.id // Use session user ID

    const body = await request.json()
    const validatedData = sendMessageSchema.parse(body)

    // Verify receiver exists
    const receiver = await db.user.findUnique({
      where: { id: validatedData.receiverId }
    })

    if (!receiver) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    const message = await db.message.create({
      data: {
        senderId,
        receiverId: validatedData.receiverId,
        subject: validatedData.subject,
        content: validatedData.content
      }
    })

    // Create notification for receiver
    await db.notification.create({
      data: {
        userId: validatedData.receiverId,
        type: 'NEW_MESSAGE',
        title: 'رسالة جديدة',
        message: `لديك رسالة جديدة من ${auth.user.name || 'مستخدم'}`,
        data: { messageId: message.id }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'تم إرسال الرسالة',
      data: message
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// Mark message as read
export async function PUT(request: NextRequest) {
  try {
    // SECURITY: Get user from session
    const auth = await getAuthUser(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode })
    }
    
    const userId = auth.user.id

    const body = await request.json()
    const { messageId } = markReadSchema.parse(body)

    // SECURITY: Verify message belongs to this user
    const message = await db.message.findUnique({
      where: { id: messageId }
    })

    if (!message) {
      return NextResponse.json({ error: 'الرسالة غير موجودة' }, { status: 404 })
    }

    if (message.receiverId !== userId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    await db.message.update({
      where: { id: messageId },
      data: { isRead: true, readAt: new Date() }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// Delete message (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    // SECURITY: Get user from session
    const auth = await getAuthUser(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode })
    }
    
    const userId = auth.user.id

    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('messageId')

    if (!messageId) {
      return NextResponse.json({ error: 'معرف الرسالة مطلوب' }, { status: 400 })
    }

    // SECURITY: Verify message belongs to this user
    const message = await db.message.findUnique({
      where: { id: messageId }
    })

    if (!message) {
      return NextResponse.json({ error: 'الرسالة غير موجودة' }, { status: 404 })
    }

    if (message.receiverId !== userId && message.senderId !== userId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    // Soft delete
    await db.message.update({
      where: { id: messageId },
      data: { isDeleted: true }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

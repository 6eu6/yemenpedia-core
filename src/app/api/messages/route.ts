import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const sendMessageSchema = z.object({
  receiverId: z.string(),
  subject: z.string().optional(),
  content: z.string().min(1, 'المحتوى مطلوب')
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') || 'inbox' // inbox | sent
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!userId) {
      return NextResponse.json({ error: 'userId مطلوب' }, { status: 400 })
    }

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
    console.error('Get messages error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = sendMessageSchema.parse(body)
    
    // In production, get senderId from session
    const senderId = 'placeholder'

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
        message: `لديك رسالة جديدة`,
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
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageId, markRead } = body

    if (markRead && messageId) {
      await db.message.update({
        where: { id: messageId },
        data: { isRead: true, readAt: new Date() }
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
  } catch (error) {
    console.error('Update message error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

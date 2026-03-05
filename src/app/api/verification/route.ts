import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Create verification request
export async function POST(request: NextRequest) {
  try {
    const { userId, reason, documents } = await request.json()

    if (!userId || !reason) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    // Check if user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    // Check if already verified
    if (user.isVerified) {
      return NextResponse.json({ error: 'حسابك موثق بالفعل' }, { status: 400 })
    }

    // Check for existing pending request
    const existingRequest = await db.verificationRequest.findUnique({
      where: { userId }
    })

    if (existingRequest && existingRequest.status === 'PENDING') {
      return NextResponse.json({ error: 'لديك طلب قيد المراجعة' }, { status: 400 })
    }

    // Create or update request
    const verificationRequest = await db.verificationRequest.upsert({
      where: { userId },
      create: { userId, reason, documents },
      update: { reason, documents, status: 'PENDING', reviewedBy: null, reviewNote: null }
    })

    return NextResponse.json({ success: true, request: verificationRequest })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// Get verification status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { isVerified: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    const verificationRequest = await db.verificationRequest.findUnique({
      where: { userId }
    })

    return NextResponse.json({
      isVerified: user.isVerified,
      hasRequest: !!verificationRequest,
      status: verificationRequest?.status || null,
      request: verificationRequest
    })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// Review verification (admin only)
export async function PUT(request: NextRequest) {
  try {
    const { requestId, status, reviewNote, reviewerId } = await request.json()

    if (!requestId || !status || !reviewerId) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    // Verify reviewer is admin
    const reviewer = await db.user.findUnique({
      where: { id: reviewerId },
      select: { role: true }
    })

    if (!reviewer || reviewer.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 403 })
    }

    const verificationRequest = await db.verificationRequest.findUnique({
      where: { id: requestId }
    })

    if (!verificationRequest) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
    }

    // Update request
    const updated = await db.verificationRequest.update({
      where: { id: requestId },
      data: { status, reviewNote, reviewedBy: reviewerId }
    })

    // If approved, update user
    if (status === 'APPROVED') {
      await db.user.update({
        where: { id: verificationRequest.userId },
        data: { isVerified: true }
      })
    }

    return NextResponse.json({ success: true, request: updated })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Get current user from session cookie
 * This endpoint is called by the frontend to get the current user
 * NO localStorage - uses HTTP-only cookies only
 */
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session')
    
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      )
    }
    
    let session
    try {
      session = JSON.parse(sessionCookie.value)
    } catch {
      // Invalid session cookie
      const response = NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      )
      response.cookies.delete('session')
      return response
    }
    
    // Fetch full user data from database
    const user = await db.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        image: true,
        isBanned: true,
      }
    })
    
    if (!user || user.isBanned) {
      const response = NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      )
      response.cookies.delete('session')
      return response
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        image: user.image,
      },
      authenticated: true
    })
    
  } catch (error) {
    return NextResponse.json(
      { user: null, authenticated: false },
      { status: 200 }
    )
  }
}

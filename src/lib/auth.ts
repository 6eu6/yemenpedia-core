// =============================================
// Yemenpedia - NextAuth Configuration
// =============================================

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { db } from './db'
import { verifyPassword, normalizeEmail } from './auth-utils'
import { UserRole } from '@/types/auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      image: string | null
      role: UserRole
      isVerified: boolean
      isActive: boolean
      isBanned: boolean
      preferredLang: string
    }
  }

  interface User {
    id: string
    email: string
    name: string | null
    image: string | null
    role: UserRole
    isVerified: boolean
    isActive: boolean
    isBanned: boolean
    preferredLang: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    name: string | null
    picture: string | null
    role: UserRole
    isVerified: boolean
    isActive: boolean
    isBanned: boolean
    preferredLang: string
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),

  providers: [
    // Credentials Provider (Email/Password)
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'name@example.com',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('البريد الإلكتروني وكلمة المرور مطلوبان')
        }

        const email = normalizeEmail(credentials.email)

        // Find user by email
        const user = await db.user.findUnique({
          where: { email },
        })

        if (!user) {
          throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        }

        // Check if user has a password (OAuth users might not)
        if (!user.password) {
          throw new Error('يرجى تسجيل الدخول باستخدام الحساب المرتبط بهذا البريد')
        }

        // Verify password
        const isValid = await verifyPassword(credentials.password, user.password)
        if (!isValid) {
          throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        }

        // Check if user is banned
        if (user.isBanned) {
          throw new Error('تم حظر حسابك. يرجى التواصل مع الإدارة')
        }

        // Check if user is active
        if (!user.isActive) {
          throw new Error('حسابك غير مفعل. يرجى التواصل مع الإدارة')
        }

        // Update last login
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role as UserRole,
          isVerified: user.isVerified,
          isActive: user.isActive,
          isBanned: user.isBanned,
          preferredLang: user.preferredLang,
        }
      },
    }),

    // Google OAuth Provider
    GoogleProvider({
      id: 'google',
      name: 'Google',
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: 'VISITOR' as UserRole,
          isVerified: profile.email_verified ?? false,
          isActive: true,
          isBanned: false,
          preferredLang: 'ar',
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update every 24 hours
  },

  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/register',
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      // For OAuth providers
      if (account?.provider === 'google') {
        // Check if user exists
        const existingUser = await db.user.findUnique({
          where: { email: user.email! },
        })

        if (existingUser) {
          // Check if user is banned
          if (existingUser.isBanned) {
            throw new Error('تم حظر حسابك. يرجى التواصل مع الإدارة')
          }

          // Update Google ID if not set
          if (!existingUser.googleId && profile?.sub) {
            await db.user.update({
              where: { id: existingUser.id },
              data: {
                googleId: profile.sub,
                lastLoginAt: new Date(),
              },
            })
          } else {
            // Just update last login
            await db.user.update({
              where: { id: existingUser.id },
              data: { lastLoginAt: new Date() },
            })
          }

          // Return the existing user data
          user.id = existingUser.id
          user.role = existingUser.role as UserRole
          user.isVerified = existingUser.isVerified
          user.isActive = existingUser.isActive
          user.isBanned = existingUser.isBanned
          user.preferredLang = existingUser.preferredLang
        } else {
          // Create new user for OAuth
          const newUser = await db.user.create({
            data: {
              email: user.email!,
              name: user.name,
              image: user.image,
              googleId: profile?.sub,
              role: 'VISITOR',
              isVerified: (profile as { email_verified?: boolean })?.email_verified ?? true,
              isActive: true,
              preferredLang: 'ar',
            },
          })
          user.id = newUser.id
          user.role = newUser.role as UserRole
          user.isVerified = newUser.isVerified
          user.isActive = newUser.isActive
          user.isBanned = newUser.isBanned
          user.preferredLang = newUser.preferredLang
        }
      }

      return true
    },

    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
        token.role = user.role
        token.isVerified = user.isVerified
        token.isActive = user.isActive
        token.isBanned = user.isBanned
        token.preferredLang = user.preferredLang
      }

      // On session update (e.g., profile update)
      if (trigger === 'update' && session) {
        token.name = session.name
        token.picture = session.image
        token.preferredLang = session.preferredLang
      }

      // Refresh user data from database periodically
      if (token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id },
          select: {
            role: true,
            isVerified: true,
            isActive: true,
            isBanned: true,
            preferredLang: true,
            name: true,
            image: true,
          },
        })

        if (dbUser) {
          token.role = dbUser.role as UserRole
          token.isVerified = dbUser.isVerified
          token.isActive = dbUser.isActive
          token.isBanned = dbUser.isBanned
          token.preferredLang = dbUser.preferredLang
          token.name = dbUser.name
          token.picture = dbUser.image
        }
      }

      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name,
          image: token.picture,
          role: token.role,
          isVerified: token.isVerified,
          isActive: token.isActive,
          isBanned: token.isBanned,
          preferredLang: token.preferredLang,
        }
      }
      return session
    },

    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },

  events: {
    async signIn({ user, account }) {
      console.log(`User signed in: ${user.email} via ${account?.provider || 'credentials'}`)
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token?.email}`)
    },
    async createUser({ user }) {
      console.log(`New user created: ${user.email}`)
    },
  },

  debug: process.env.NODE_ENV === 'development',
}

// Helper function to get server-side session
export { getServerSession } from 'next-auth'

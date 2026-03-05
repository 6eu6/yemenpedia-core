'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  User,
  MapPin,
  Globe,
  Calendar,
  Eye,
  Heart,
  FileText,
  Award,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow, format } from 'date-fns'
import { ar } from 'date-fns/locale'

interface BadgeType {
  badgeType: string
  earnedAt: Date
}

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  viewCount: number
  likeCount: number
  createdAt: Date
  category: { name: string; slug: string }
}

interface UserPublicData {
  id: string
  name: string | null
  username: string
  bio: string | null
  image: string | null
  location: string | null
  website: string | null
  role: string
  points: number
  createdAt: Date
  badges: BadgeType[]
  articles: Article[]
  _count: { articles: number }
}

const badgeLabels: Record<string, string> = {
  CONTRIBUTOR: 'مساهم',
  ACTIVE_WRITER: 'كاتب نشط',
  EXPERT_WRITER: 'كاتب خبير',
  VERIFIED_AUTHOR: 'كاتب موثق',
  TOP_CONTRIBUTOR: 'أفضل مساهم',
  PIONEER: 'رائد',
  REVIEWER: 'مراجع',
  SUPERVISOR_BADGE: 'مشرف'
}

// Zinc color system per Article II, Section 2.2
const badgeColors: Record<string, string> = {
  CONTRIBUTOR: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100',
  ACTIVE_WRITER: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-600 dark:text-zinc-200',
  EXPERT_WRITER: 'bg-zinc-300 text-zinc-900 dark:bg-zinc-500 dark:text-zinc-100',
  VERIFIED_AUTHOR: 'bg-amber-100 text-amber-700',
  TOP_CONTRIBUTOR: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  PIONEER: 'bg-yellow-100 text-yellow-700',
  REVIEWER: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
  SUPERVISOR_BADGE: 'bg-zinc-300 text-zinc-800 dark:bg-zinc-600 dark:text-zinc-100'
}

interface UserPublicProfileProps {
  user: UserPublicData
}

export function UserPublicProfile({ user }: UserPublicProfileProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-0 shadow-xl mb-6">
            <CardContent className="pt-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar */}
                <Avatar className="h-28 w-28 ring-4 ring-zinc-100">
                  <AvatarImage src={user.image || ''} />
                  <AvatarFallback className="bg-zinc-600 text-white text-4xl">
                    {user.name?.charAt(0) || user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 text-center md:text-right">
                  <h1 className="text-3xl font-bold">{user.name || user.username}</h1>
                  <p className="text-zinc-500 text-lg">@{user.username}</p>

                  {/* Role Badge */}
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                    <Badge variant="secondary" className="text-sm focus-visible:ring-2 focus-visible:ring-blue-500">{user.role}</Badge>
                    <Badge className="bg-amber-100 text-amber-700">
                      <Award className="h-3 w-3 ml-1" />
                      {user.points} نقطة
                    </Badge>
                  </div>

                  {/* Bio */}
                  {user.bio && (
                    <p className="mt-4 text-zinc-600 dark:text-zinc-300 max-w-xl">
                      {user.bio}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-sm text-zinc-500">
                    {user.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {user.location}
                      </span>
                    )}
                    {user.website && (
                      <a
                        href={user.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-zinc-600 hover:underline focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <Globe className="h-4 w-4" />
                        الموقع الشخصي
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      انضم {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: ar })}
                    </span>
                  </div>

                  {/* Badges */}
                  {user.badges.length > 0 && (
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                      {user.badges.map((badge, index) => (
                        <Badge
                          key={index}
                          className={badgeColors[badge.badgeType] || 'bg-zinc-100 text-zinc-700'}
                        >
                          {badgeLabels[badge.badgeType] || badge.badgeType}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
              <p className="text-2xl font-bold">{user._count.articles}</p>
              <p className="text-sm text-zinc-500">مقالة</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6 text-center">
              <Eye className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">
                {user.articles.reduce((sum, a) => sum + a.viewCount, 0).toLocaleString('ar-YE')}
              </p>
              <p className="text-sm text-zinc-500">مشاهدة</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6 text-center">
              <Heart className="h-8 w-8 mx-auto mb-2 text-pink-600" />
              <p className="text-2xl font-bold">
                {user.articles.reduce((sum, a) => sum + a.likeCount, 0).toLocaleString('ar-YE')}
              </p>
              <p className="text-sm text-zinc-500">إعجاب</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6 text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-amber-600" />
              <p className="text-2xl font-bold">{user.points}</p>
              <p className="text-sm text-zinc-500">نقطة</p>
            </CardContent>
          </Card>
        </div>

        {/* Articles */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-zinc-600" />
              المقالات ({user.articles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.articles.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-zinc-300" />
                <p>لا توجد مقالات منشورة بعد</p>
              </div>
            ) : (
              <div className="space-y-4">
                {user.articles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/article/${article.slug}`}>
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg hover:text-zinc-600 transition-colors">
                              {article.title}
                            </h3>
                            {article.excerpt && (
                              <p className="text-zinc-500 text-sm mt-1 line-clamp-2">
                                {article.excerpt}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-zinc-400">
                              <Badge variant="outline" className="text-xs">
                                {article.category.name}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {article.viewCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {article.likeCount}
                              </span>
                              <span>
                                {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true, locale: ar })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

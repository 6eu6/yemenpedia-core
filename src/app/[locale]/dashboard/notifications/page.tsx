'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import { useTranslations, useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Check, Loader2, FileText, User, Heart, MessageCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

// Force dynamic rendering - uses client-side auth
export const dynamic = 'force-dynamic'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const router = useRouter()
  const t = useTranslations('notifications')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const isRTL = locale === 'ar'

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated) {
      // Simulate loading notifications
      setTimeout(() => {
        setNotifications([
          {
            id: '1',
            type: 'ARTICLE_APPROVED',
            title: isRTL ? 'تمت الموافقة على مقالك' : 'Your article was approved',
            message: isRTL ? 'تمت الموافقة على مقالك "تاريخ صنعاء القديم" ونشره' : 'Your article "Ancient History of Sana\'a" was approved and published',
            read: false,
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            type: 'NEW_FOLLOWER',
            title: isRTL ? 'متابع جديد' : 'New follower',
            message: isRTL ? 'أحمد اليمن بدأ بمتابعتك' : 'Ahmed Yemen started following you',
            read: false,
            createdAt: new Date(Date.now() - 3600000).toISOString()
          }
        ])
        setIsLoading(false)
      }, 500)
    }
  }, [isAuthenticated, isRTL])

  const getIcon = (type: string) => {
    switch (type) {
      case 'ARTICLE_APPROVED':
      case 'ARTICLE_REJECTED':
        return <FileText className="h-5 w-5 text-green-500" />
      case 'NEW_FOLLOWER':
        return <User className="h-5 w-5 text-blue-500" />
      case 'LIKE':
        return <Heart className="h-5 w-5 text-pink-500" />
      case 'COMMENT':
        return <MessageCircle className="h-5 w-5 text-purple-500" />
      default:
        return <Bell className="h-5 w-5 text-zinc-500" />
    }
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-zinc-500 mt-1">
            {isRTL ? 'آخر الإشعارات والتحديثات' : 'Latest notifications and updates'}
          </p>
        </div>
        {notifications.some(n => !n.read) && (
          <Button variant="outline" onClick={markAllAsRead} className="focus-visible:ring-2 focus-visible:ring-blue-500">
            <Check className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
            {t('markAllRead')}
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Bell className="h-16 w-16 mx-auto mb-4 text-zinc-300" />
              <p>{t('noNotifications')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-start gap-4 p-4 rounded-xl transition-colors ${
                    notification.read 
                      ? 'bg-zinc-50 dark:bg-zinc-800' 
                      : 'bg-zinc-100 dark:bg-zinc-700'
                  }`}
                >
                  <div className="mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{notification.title}</h3>
                    <p className="text-sm text-zinc-500 mt-1">{notification.message}</p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-zinc-500 rounded-full mt-2" />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

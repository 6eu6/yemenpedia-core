'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import { useTranslations, useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MessageSquare, Send, Loader2, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

// Force dynamic rendering - uses client-side auth
export const dynamic = 'force-dynamic'

interface Message {
  id: string
  sender: { name: string; username: string }
  subject: string
  content: string
  read: boolean
  createdAt: string
}

export default function MessagesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations('messages')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [replyContent, setReplyContent] = useState('')

  const isRTL = locale === 'ar'

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated) {
      // Simulate loading messages
      setTimeout(() => {
        setMessages([
          {
            id: '1',
            sender: { name: isRTL ? 'فريق يمنبيديا' : 'Yemenpedia Team', username: 'yemenpedia' },
            subject: isRTL ? 'مرحباً بك في يمنبيديا!' : 'Welcome to Yemenpedia!',
            content: isRTL 
              ? 'شكراً لانضمامك إلى مجتمع يمنبيديا. نتطلع لمساهماتك في إثراء المحتوى اليمني.'
              : 'Thank you for joining the Yemenpedia community. We look forward to your contributions.',
            read: false,
            createdAt: new Date().toISOString()
          }
        ])
        setIsLoading(false)
      }, 500)
    }
  }, [isAuthenticated, isRTL])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-zinc-500 mt-1">
          {isRTL ? 'رسائلك ومراسلاتك' : 'Your messages and correspondence'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <Card className="lg:col-span-1 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">{t('inbox')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-zinc-300" />
                <p>{t('noMessages')}</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-700">
                {messages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`w-full p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      selectedMessage?.id === msg.id ? 'bg-zinc-100 dark:bg-zinc-700' : ''
                    } ${!msg.read ? 'font-medium' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-zinc-600">
                          {msg.sender.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{msg.sender.name}</p>
                        <p className="text-sm text-zinc-500 truncate">{msg.subject}</p>
                      </div>
                      {!msg.read && (
                        <div className="w-2 h-2 bg-zinc-500 rounded-full" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Content */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          {selectedMessage ? (
            <>
              <CardHeader>
                <CardTitle>{selectedMessage.subject}</CardTitle>
                <p className="text-sm text-zinc-500">
                  {isRTL ? 'من:' : 'From:'} {selectedMessage.sender.name} (@{selectedMessage.sender.username})
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-700">
                  <Label>{t('reply')}</Label>
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={isRTL ? 'اكتب ردك هنا...' : 'Write your reply here...'}
                    rows={3}
                    className="mt-2 focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                  <Button 
                    className="mt-2 bg-zinc-900 hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500"
                    onClick={() => {
                      toast({ title: tCommon('success') })
                      setReplyContent('')
                    }}
                  >
                    <Send className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                    {t('send')}
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center min-h-[300px] text-zinc-500">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-zinc-300" />
                <p>{isRTL ? 'اختر رسالة لعرضها' : 'Select a message to view'}</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}

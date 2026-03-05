'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import { Link } from '@/i18n/routing'
import { useTranslations, useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  User, Mail, MapPin, Calendar, Link as LinkIcon, 
  Loader2, Camera, Save
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

// Force dynamic rendering - uses client-side auth
export const dynamic = 'force-dynamic'

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations('profile')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    website: ''
  })

  const isRTL = locale === 'ar'

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: (user as any).bio || '',
        location: (user as any).location || '',
        website: (user as any).website || ''
      })
    }
  }, [user])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          ...formData
        })
      })

      if (res.ok) {
        toast({ title: tCommon('success'), description: tCommon('success') })
      } else {
        toast({ variant: 'destructive', title: tCommon('error') })
      }
    } catch {
      toast({ variant: 'destructive', title: tCommon('error') })
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('editProfile')}</h1>
        <p className="text-zinc-500 mt-1">
          {isRTL ? 'تعديل معلومات ملفك الشخصي' : 'Edit your profile information'}
        </p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isRTL ? 'المعلومات الأساسية' : 'Basic Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-zinc-600">
                {user.name?.charAt(0) || (isRTL ? 'ي' : 'Y')}
              </span>
            </div>
            <Button variant="outline" className="focus-visible:ring-2 focus-visible:ring-blue-500">
              <Camera className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {t('editAvatar')}
            </Button>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{isRTL ? 'الاسم' : 'Name'}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={isRTL ? 'أدخل اسمك' : 'Enter your name'}
              className="focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">{t('bio')}</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder={t('noBio')}
              rows={3}
              className="focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t('location')}
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder={isRTL ? 'مثال: صنعاء، اليمن' : 'Example: Sana\'a, Yemen'}
              className="focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              {t('website')}
            </Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://example.com"
              className="focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} className="bg-zinc-900 hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500">
              {isSaving ? (
                <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
              ) : (
                <Save className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              )}
              {tCommon('save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>{isRTL ? 'معلومات الحساب' : 'Account Information'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-sm text-zinc-500">{isRTL ? 'البريد الإلكتروني' : 'Email'}</p>
              <p>{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-sm text-zinc-500">{t('joined')}</p>
              <p>{new Date((user as any).createdAt || Date.now()).toLocaleDateString(locale === 'ar' ? 'ar-YE' : 'en-US')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">{user.role}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

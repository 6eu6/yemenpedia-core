'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import { useTranslations, useLocale } from 'next-intl'
import { 
  Bell, Globe, Moon, Sun, Loader2, Key, LogOut, Shield, 
  Smartphone, Mail, Eye, EyeOff, Check
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useTheme } from 'next-themes'
import { useRouter as useRouterBase, usePathname } from '@/i18n/routing'
import { useAuth } from '@/contexts/AuthContext'

export default function SettingsPage() {
  const router = useRouterBase()
  const toast = useToast()
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const { theme, setTheme } = useTheme()
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const isRTL = locale === 'ar'
  
  const [isSaving, setIsSaving] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    language: locale
  })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [authLoading, isAuthenticated, router])

  const handleSave = async () => {
    setIsSaving(true)
    // TODO: Save settings to database
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsSaving(false)
    toast.toast({ title: t('saved'), description: t('savedDesc') })
  }

  const handleLogout = async () => {
    await logout()
  }

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.toast({ variant: 'destructive', title: tCommon('error'), description: t('allFieldsRequired') })
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast.toast({ variant: 'destructive', title: tCommon('error'), description: t('passwordTooShort') })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.toast({ variant: 'destructive', title: tCommon('error'), description: t('passwordMismatch') })
      return
    }

    setPasswordLoading(true)

    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.toast({ title: tCommon('success'), description: t('passwordChanged') })
        setShowPasswordDialog(false)
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        toast.toast({ variant: 'destructive', title: tCommon('error'), description: data.error || tCommon('error') })
      }
    } catch {
      toast.toast({ variant: 'destructive', title: tCommon('error'), description: tCommon('error') })
    } finally {
      setPasswordLoading(false)
    }
  }

  // Password strength
  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[!@#$%^&*]/.test(password)) strength++
    return strength
  }

  const strength = getPasswordStrength(passwordForm.newPassword)
  const strengthLabels = [t('passwordStrength.weak'), t('passwordStrength.medium'), t('passwordStrength.good'), t('passwordStrength.strong')]
  const strengthColors = ['bg-zinc-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500']

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
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-zinc-500 mt-1">{t('subtitle')}</p>
      </div>

      <div className="grid gap-6">
        {/* Appearance */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              {t('appearance')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>{t('darkMode')}</Label>
                <p className="text-sm text-zinc-500">{t('darkModeDesc')}</p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                className="focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5" />
              {t('language')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={settings.language} onValueChange={(value) => {
              setSettings({ ...settings, language: value })
              // Navigate to the same page with new locale
              window.location.href = `/${value}/dashboard/settings`
            }}>
              <SelectTrigger className="w-full md:w-64 focus-visible:ring-2 focus-visible:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5" />
              {t('notifications')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-zinc-400" />
                <div>
                  <Label>{t('emailNotifications')}</Label>
                  <p className="text-sm text-zinc-500">{t('emailNotificationsDesc')}</p>
                </div>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                className="focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-zinc-400" />
                <div>
                  <Label>{t('pushNotifications')}</Label>
                  <p className="text-sm text-zinc-500">{t('pushNotificationsDesc')}</p>
                </div>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
                className="focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" />
              {t('security')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start h-auto py-3 focus-visible:ring-2 focus-visible:ring-blue-500"
              onClick={() => setShowPasswordDialog(true)}
            >
              <Key className={`${isRTL ? 'ml-3' : 'mr-3'} h-4 w-4`} />
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <p className="font-medium">{t('changePassword')}</p>
                <p className="text-xs text-zinc-500">{t('changePasswordDesc')}</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start h-auto py-3 text-zinc-600 hover:text-zinc-700 hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-blue-500"
              onClick={handleLogout}
            >
              <LogOut className={`${isRTL ? 'ml-3' : 'mr-3'} h-4 w-4`} />
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <p className="font-medium">{t('logout')}</p>
                <p className="text-xs text-zinc-500">{t('logoutDesc')}</p>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="bg-zinc-900 hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500">
            {isSaving ? (
              <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
            ) : null}
            {t('saveSettings')}
          </Button>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('changePasswordTitle')}</DialogTitle>
            <DialogDescription>
              {t('changePasswordDesc')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{t('currentPassword')}</Label>
              <div className="relative">
                <Input
                  type={showPasswords ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('newPassword')}</Label>
              <div className="relative">
                <Input
                  type={showPasswords ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className={`${isRTL ? 'pl-10' : 'pr-10'} focus-visible:ring-2 focus-visible:ring-blue-500`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus-visible:ring-2 focus-visible:ring-blue-500 rounded`}
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Strength indicator */}
              {passwordForm.newPassword && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i <= strength ? strengthColors[strength] : 'bg-zinc-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500">{strengthLabels[strength]}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('confirmNewPassword')}</Label>
              <Input
                type={showPasswords ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="focus-visible:ring-2 focus-visible:ring-blue-500"
              />
              {passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3" /> {t('passwordsMatch')}
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleChangePassword} 
                disabled={passwordLoading}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {passwordLoading && <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />}
                {t('change')}
              </Button>
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)} className="focus-visible:ring-2 focus-visible:ring-blue-500">
                {tCommon('cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { Link } from '@/i18n/routing'
import { useTranslations, useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, Loader2, AtSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

// Force dynamic rendering - uses client-side auth
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const locale = useLocale()
  const { isAuthenticated, refreshUser } = useAuth()
  
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    remember: false
  })

  const isRTL = locale === 'ar'
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/dashboard')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password,
          remember: formData.remember
        })
      })

      const data = await res.json()

      if (res.ok && data.user) {
        // Refresh auth context to get the new user from cookie
        await refreshUser()
        toast({ title: t('loginSuccess'), description: t('loginSuccessDesc') })
        // Use window.location for full page reload to ensure all components get fresh data
        window.location.replace(`/${locale}/dashboard`)
      } else {
        toast({ variant: 'destructive', title: tCommon('error'), description: data.error || t('loginError') })
      }
    } catch {
      toast({ variant: 'destructive', title: tCommon('error'), description: tErrors('somethingWentWrong') })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      {/* GOVERNANCE: No heavy gradients - ultra clean background */}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
            <span className="text-xl font-bold text-zinc-100 dark:text-zinc-900">Y</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Yemenpedia</h1>
            <p className="text-xs text-zinc-500">{tCommon('nationalEncyclopedia')}</p>
          </div>
        </Link>

        <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Lock className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
            </div>
            <CardTitle className="text-2xl text-zinc-900 dark:text-zinc-50">{t('loginTitle')}</CardTitle>
            <CardDescription className="text-zinc-500">{t('enterCredentials')}</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-zinc-700 dark:text-zinc-300">{t('emailOrUsername')}</Label>
                <div className="relative">
                  {formData.identifier.includes('@') ? (
                    <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400`} />
                  ) : (
                    <AtSign className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400`} />
                  )}
                  <Input
                    id="identifier"
                    type="text"
                    placeholder={t('emailOrUsername')}
                    className={`${isRTL ? 'pr-10' : 'pl-10'} bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent`}
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300">{t('password')}</Label>
                <div className="relative">
                  <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400`} />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'} bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent`}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 focus-visible:ring-2 focus-visible:ring-blue-500 rounded`}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={formData.remember}
                    onCheckedChange={(checked) => setFormData({ ...formData, remember: checked as boolean })}
                    className="border-zinc-300 dark:border-zinc-600 data-[state=checked]:bg-zinc-900 dark:data-[state=checked]:bg-zinc-100"
                  />
                  <Label htmlFor="remember" className="text-sm text-zinc-600 dark:text-zinc-400">{t('rememberMe')}</Label>
                </div>
                <Link href="/auth/forgot-password" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                  {t('forgotPassword')}
                </Link>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-blue-500" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                    {t('loggingIn')}
                  </>
                ) : (
                  <>
                    {t('loginButton')}
                    <ArrowIcon className={`${isRTL ? 'mr-2' : 'ml-2'} h-4 w-4`} />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                {t('noAccount')}{' '}
                <Link href="/auth/register" className="text-zinc-900 dark:text-zinc-100 font-medium hover:underline focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                  {t('createNewAccount')}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}

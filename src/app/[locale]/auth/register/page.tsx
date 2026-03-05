'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { Link } from '@/i18n/routing'
import { useTranslations, useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, Loader2, User, Check, AtSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const tSettings = useTranslations('settings')
  const locale = useLocale()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  })

  const isRTL = locale === 'ar'
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight

  // Check username availability
  const checkUsername = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null)
      return
    }
    
    setUsernameChecking(true)
    try {
      const res = await fetch(`/api/auth/check-username?username=${username}`)
      const data = await res.json()
      setUsernameAvailable(data.available)
    } catch {
      setUsernameAvailable(null)
    } finally {
      setUsernameChecking(false)
    }
  }

  const passwordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[!@#$%^&*]/.test(password)) strength++
    return strength
  }

  const strength = passwordStrength(formData.password)
  const strengthLabels = [
    tSettings('passwordStrength.weak'),
    tSettings('passwordStrength.medium'),
    tSettings('passwordStrength.good'),
    tSettings('passwordStrength.strong')
  ]
  // GOVERNANCE: Zinc colors for strength indicator
  const strengthColors = ['bg-zinc-400', 'bg-zinc-500', 'bg-zinc-600', 'bg-zinc-700', 'bg-zinc-800']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate username
    if (!formData.username || formData.username.length < 3) {
      toast({ variant: 'destructive', title: tCommon('error'), description: locale === 'ar' ? 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' : 'Username must be at least 3 characters' })
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      toast({ variant: 'destructive', title: tCommon('error'), description: locale === 'ar' ? 'اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام و_ فقط' : 'Username can only contain letters, numbers, and underscores' })
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({ variant: 'destructive', title: tCommon('error'), description: tErrors('passwordMismatch') })
      return
    }

    if (!formData.acceptTerms) {
      toast({ variant: 'destructive', title: tCommon('error'), description: locale === 'ar' ? 'يجب الموافقة على الشروط والأحكام' : 'You must accept the terms and conditions' })
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username.toLowerCase(),
          email: formData.email,
          password: formData.password
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast({ title: t('registerSuccess'), description: t('registerSuccessDesc') })
        router.push('/auth/login')
      } else {
        toast({ variant: 'destructive', title: tCommon('error'), description: data.error || t('registerError') })
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
            <CardTitle className="text-2xl text-zinc-900 dark:text-zinc-50">{t('registerTitle')}</CardTitle>
            <CardDescription className="text-zinc-500">
              {locale === 'ar' ? 'انضم إلى مجتمع يمنبيديا' : 'Join the Yemenpedia community'}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-700 dark:text-zinc-300">{t('name')}</Label>
                <div className="relative">
                  <User className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400`} />
                  <Input
                    id="name"
                    type="text"
                    placeholder={t('name')}
                    className={`${isRTL ? 'pr-10' : 'pl-10'} bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent`}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-zinc-700 dark:text-zinc-300">
                  {t('username')}
                  <span className="text-xs text-zinc-500 mx-2">({locale === 'ar' ? 'يظهر في ملفك الشخصي' : 'Shown in your profile'})</span>
                </Label>
                <div className="relative">
                  <AtSign className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400`} />
                  <Input
                    id="username"
                    type="text"
                    placeholder="ahmed_yemen"
                    className={`${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'} bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent`}
                    value={formData.username}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                      setFormData({ ...formData, username: value })
                      checkUsername(value)
                    }}
                    required
                    minLength={3}
                    maxLength={30}
                  />
                  {usernameChecking && (
                    <Loader2 className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-zinc-400`} />
                  )}
                  {!usernameChecking && usernameAvailable === true && formData.username.length >= 3 && (
                    <Check className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 dark:text-zinc-400`} />
                  )}
                  {!usernameChecking && usernameAvailable === false && (
                    <span className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-zinc-500 text-xs`}>
                      {locale === 'ar' ? 'محجوز' : 'Taken'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500">
                  {locale === 'ar' ? 'أحرف إنجليزية، أرقام، و _ فقط. مثال: ahmed_yemen' : 'Letters, numbers, and _ only. Example: ahmed_yemen'}
                </p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300">
                  {t('email')}
                  <span className="text-xs text-zinc-500 mx-2">({locale === 'ar' ? 'للتوثيق فقط - مخفي' : 'For verification only - hidden'})</span>
                </Label>
                <div className="relative">
                  <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400`} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    className={`${isRTL ? 'pr-10' : 'pl-10'} bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent`}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Password */}
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
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 focus-visible:ring-2 focus-visible:ring-blue-500 rounded`}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Password Strength */}
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${
                            i <= strength ? strengthColors[strength] : 'bg-zinc-200 dark:bg-zinc-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-zinc-500">{strengthLabels[strength]}</p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-zinc-700 dark:text-zinc-300">{t('confirmPassword')}</Label>
                <div className="relative">
                  <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400`} />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className={`${isRTL ? 'pr-10' : 'pl-10'} bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent`}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <Check className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 dark:text-zinc-400`} />
                  )}
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked as boolean })}
                  className="border-zinc-300 dark:border-zinc-600 data-[state=checked]:bg-zinc-900 dark:data-[state=checked]:bg-zinc-100"
                />
                <Label htmlFor="terms" className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {locale === 'ar' ? (
                    <>
                      أوافق على{' '}
                      <Link href="/terms" className="text-zinc-900 dark:text-zinc-100 hover:underline focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                        الشروط والأحكام
                      </Link>
                      {' '}و{' '}
                      <Link href="/privacy" className="text-zinc-900 dark:text-zinc-100 hover:underline focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                        سياسة الخصوصية
                      </Link>
                    </>
                  ) : (
                    <>
                      I agree to the{' '}
                      <Link href="/terms" className="text-zinc-900 dark:text-zinc-100 hover:underline focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                        Terms of Service
                      </Link>
                      {' '}and{' '}
                      <Link href="/privacy" className="text-zinc-900 dark:text-zinc-100 hover:underline focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                        Privacy Policy
                      </Link>
                    </>
                  )}
                </Label>
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
                    {t('creatingAccount')}
                  </>
                ) : (
                  <>
                    {t('registerButton')}
                    <ArrowIcon className={`${isRTL ? 'mr-2' : 'ml-2'} h-4 w-4`} />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                {t('haveAccount')}{' '}
                <Link href="/auth/login" className="text-zinc-900 dark:text-zinc-100 font-medium hover:underline focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                  {t('loginButton')}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}

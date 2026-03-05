'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect /auth/login to /ar/auth/login or /en/auth/login
export default function LoginRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    const browserLang = navigator.language.split('-')[0]
    const locale = browserLang === 'ar' ? 'ar' : 'en'
    router.replace(`/${locale}/auth/login`)
  }, [router])
  
  return null
}

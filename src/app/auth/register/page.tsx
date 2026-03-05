'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect /auth/register to /ar/auth/register or /en/auth/register
export default function RegisterRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    const browserLang = navigator.language.split('-')[0]
    const locale = browserLang === 'ar' ? 'ar' : 'en'
    router.replace(`/${locale}/auth/register`)
  }, [router])
  
  return null
}

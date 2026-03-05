'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect /dashboard to /ar/dashboard or /en/dashboard
export default function DashboardRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    const browserLang = navigator.language.split('-')[0]
    const locale = browserLang === 'ar' ? 'ar' : 'en'
    router.replace(`/${locale}/dashboard`)
  }, [router])
  
  return null
}

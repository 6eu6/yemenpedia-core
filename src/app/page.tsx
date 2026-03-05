'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RootPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Detect browser language - only Arabic and English supported
    const browserLang = navigator.language.split('-')[0]
    const locale = browserLang === 'ar' ? 'ar' : 'en'
    
    // Redirect to locale (preference will be stored in cookie by middleware)
    router.replace('/' + locale)
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-600 mx-auto"></div>
        <p className="mt-4 text-zinc-500">Loading...</p>
      </div>
    </div>
  )
}

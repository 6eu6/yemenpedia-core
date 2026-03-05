'use client'

import { Suspense } from 'react'
import { SearchPageContent } from './search-content'

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-600 dark:border-zinc-400 mx-auto"></div>
          <p className="mt-4 text-zinc-500 dark:text-zinc-400">جارٍ التحميل...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}

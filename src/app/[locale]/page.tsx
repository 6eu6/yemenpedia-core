'use client'

import { useTheme } from 'next-themes'
import { useLocale } from 'next-intl'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/home/HeroSection'
import { CategoriesGrid } from '@/components/home/CategoriesGrid'
import { MapSection } from '@/components/home/MapSection'
import { LatestArticles } from '@/components/home/LatestArticles'
import { StatsSection } from '@/components/home/StatsSection'
import { CTASection } from '@/components/home/CTASection'
import { useRouter, usePathname } from '@/i18n/routing'
import { useAuth } from '@/contexts/AuthContext'

// Force dynamic rendering - uses client-side auth
export const dynamic = 'force-dynamic'

export default function Home() {
  const { theme, setTheme } = useTheme()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuth()

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const handleLanguageChange = (newLang: string) => {
    router.replace(pathname, { locale: newLang })
  }

  const handleLogout = async () => {
    await logout()
  }

  // Only Arabic is RTL
  const isRTL = locale === 'ar'
  const dir = isRTL ? 'rtl' : 'ltr'

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-900 transition-colors" dir={dir}>
      <Header
        isDark={theme === 'dark'}
        onThemeToggle={handleThemeToggle}
        currentLang={locale}
        onLanguageChange={handleLanguageChange}
        isAuthenticated={isAuthenticated}
        user={user ? { id: user.id, name: user.name, username: user.username, role: user.role } : undefined}
        onLogout={handleLogout}
      />
      
      <main className="flex-1">
        <HeroSection />
        <CategoriesGrid />
        <MapSection />
        <LatestArticles />
        <StatsSection />
        <CTASection />
      </main>
      
      <Footer />
    </div>
  )
}

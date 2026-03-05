'use client'

import { useEffect } from 'react'
import { Link } from '@/i18n/routing'
import { usePathname, useRouter } from '@/i18n/routing'
import { useTranslations, useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  FileText,
  PenTool,
  FolderTree,
  Bell,
  MessageSquare,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  Users,
  Loader2,
  AtSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const isSidebarOpen = false

  const isRTL = locale === 'ar'

  const sidebarItems = [
    { name: t('title'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('myArticles'), href: '/dashboard/articles', icon: FileText },
    { name: t('writeArticle'), href: '/dashboard/write', icon: PenTool },
    { name: t('categories'), href: '/dashboard/categories', icon: FolderTree },
    { name: t('notifications'), href: '/dashboard/notifications', icon: Bell },
    { name: t('messages'), href: '/dashboard/messages', icon: MessageSquare },
    { name: t('profile'), href: '/dashboard/profile', icon: User },
    { name: t('settings'), href: '/dashboard/settings', icon: Settings },
  ]

  const supervisorItems = [
    { name: t('reviewArticles'), href: '/dashboard/review', icon: Shield },
    { name: t('manageCategories'), href: '/dashboard/manage-categories', icon: FolderTree },
  ]

  const verifierItems = [
    { name: t('manageUsers'), href: '/dashboard/users', icon: Users },
  ]

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [authLoading, isAuthenticated, router])

  const handleLogout = async () => {
    await logout()
  }

  const isAdmin = user?.role === 'ADMIN'
  const isVerifier = user?.role === 'VERIFIER' || isAdmin
  const isSupervisor = user?.role === 'SUPERVISOR' || isVerifier

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Mobile Toggle - GOVERNANCE: RTL support with proper positioning */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "fixed top-4 z-50 lg:hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500",
          isRTL ? "left-4" : "right-4"
        )}
        onClick={() => {}}
      >
        <Menu className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
      </Button>

      {/* Sidebar - GOVERNANCE: RTL support with proper anchoring */}
      <aside
        className={cn(
          "fixed top-0 z-40 h-full w-72 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm transition-transform duration-300",
          isRTL ? "right-0 border-l" : "left-0 border-r",
          "lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                <span className="text-lg font-bold text-zinc-100 dark:text-zinc-900">Y</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Yemenpedia</h1>
                <p className="text-xs text-zinc-500">{t('title')}</p>
              </div>
            </Link>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-700">
                <AvatarImage src={user.image || ''} />
                <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {user.name?.charAt(0) || (isRTL ? 'ي' : 'Y')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-900 dark:text-zinc-50 truncate">{user.name}</p>
                <p className="text-xs text-zinc-500 flex items-center gap-1">
                  <AtSign className="h-3 w-3" />
                  {user.username}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 p-4">
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ x: isRTL ? 4 : -4 }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500",
                      pathname === item.href
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </motion.div>
                </Link>
              ))}

              {isSupervisor && (
                <>
                  <div className="pt-4 pb-2">
                    <p className="text-xs text-zinc-400 px-4">{t('supervisorPermissions')}</p>
                  </div>
                  {supervisorItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <motion.div
                        whileHover={{ x: isRTL ? 4 : -4 }}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500",
                          pathname === item.href
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </motion.div>
                    </Link>
                  ))}
                </>
              )}

              {isVerifier && (
                <>
                  <div className="pt-4 pb-2">
                    <p className="text-xs text-zinc-400 px-4">{t('verifierPermissions')}</p>
                  </div>
                  {verifierItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <motion.div
                        whileHover={{ x: isRTL ? 4 : -4 }}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500",
                          pathname === item.href
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </motion.div>
                    </Link>
                  ))}
                </>
              )}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
            <Link href="/">
              <Button variant="ghost" className="w-full justify-start text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 focus-visible:ring-2 focus-visible:ring-blue-500">
                {/* GOVERNANCE: RTL icon mirroring */}
                {isRTL ? <ChevronLeft className="ml-2 h-4 w-4" /> : <ChevronRight className="mr-2 h-4 w-4" />}
                {t('backToSite')}
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500"
              onClick={handleLogout}
            >
              <LogOut className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {t('logout')}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content - GOVERNANCE: RTL support */}
      <main className={isRTL ? "lg:mr-72" : "lg:ml-72"}>
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

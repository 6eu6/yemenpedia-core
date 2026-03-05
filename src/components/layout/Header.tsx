'use client'

import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link, useRouter, usePathname } from '@/i18n/routing'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, 
  X, 
  Search, 
  Globe, 
  Sun, 
  Moon, 
  User,
  Bell,
  BookOpen,
  PenTool,
  Settings,
  LogOut,
  ChevronDown,
  Home,
  FolderTree,
  FileText,
  MapPin,
  Info,
  Check,
  Scroll,
  History,
  Landmark,
  Palette,
  Coins
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'

// Supported languages (only Arabic and English for now)
const languages = [
  { code: 'ar', name: 'العربية' },
  { code: 'en', name: 'English' },
]

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

interface HeaderProps {
  isDark: boolean
  onThemeToggle: () => void
  currentLang?: string
  onLanguageChange?: (lang: string) => void
  isAuthenticated?: boolean
  user?: {
    id?: string
    name: string
    username?: string
    image?: string
    role: string
  }
  onLogout?: () => void
}

export function Header({
  isDark,
  onThemeToggle,
  currentLang: propLang,
  onLanguageChange: propOnLanguageChange,
  isAuthenticated = false,
  user,
  onLogout
}: HeaderProps) {
  const locale = useLocale()
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  
  const currentLang = propLang || locale
  const onLanguageChange = propOnLanguageChange || ((newLang: string) => {
    router.replace(pathname, { locale: newLang })
  })
  
  const isRTL = currentLang === 'ar'
  const dir = isRTL ? 'rtl' : 'ltr'
  
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  const { toast } = useToast()
  
  const currentLanguage = languages.find(l => l.code === currentLang) || languages[0]

  // GOVERNANCE: Categories with Lucide icons (NO EMOJIS)
  const mainCategories = [
    { name: t('categories.history'), slug: 'history', icon: History },
    { name: t('categories.geography'), slug: 'geography', icon: MapPin },
    { name: t('categories.culture'), slug: 'culture', icon: Palette },
    { name: t('categories.people'), slug: 'people', icon: User },
    { name: t('categories.places'), slug: 'places', icon: Landmark },
    { name: t('categories.science'), slug: 'science', icon: BookOpen },
    { name: t('categories.arts'), slug: 'arts', icon: Scroll },
    { name: t('categories.economy'), slug: 'economy', icon: Coins },
  ]

  const navItems = [
    { name: t('nav.home'), href: '/', icon: Home },
    { name: t('nav.categories'), href: '/categories', icon: FolderTree, hasDropdown: true },
    { name: t('nav.articles'), href: '/articles', icon: FileText },
    { name: t('nav.governorates'), href: '/map', icon: MapPin },
    { name: t('nav.about'), href: '/about', icon: Info },
  ]

  // Fetch notifications - only when authenticated and user has id
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchNotifications()
    }
  }, [isAuthenticated, user?.id])

  const fetchNotifications = async () => {
    if (!user?.id) return
    setIsLoadingNotifications(true)
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}`)
      const data = await res.json()
      if (res.ok) {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoadingNotifications(false)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user?.id) return
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, markAllRead: true })
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  // Mark single notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      })
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Format time ago
  const timeAgo = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return t('time.now')
    if (diffMins < 60) return t('time.minutesAgo', { count: diffMins })
    if (diffHours < 24) return t('time.hoursAgo', { count: diffHours })
    if (diffDays < 7) return t('time.daysAgo', { count: diffDays })
    return past.toLocaleDateString(currentLang === 'ar' ? 'ar-YE' : 'en-US')
  }

  return (
    // GOVERNANCE: Zinc color system - zinc-50/950 backgrounds
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/95 backdrop-blur-lg supports-[backdrop-filter]:bg-zinc-50/80 dark:bg-zinc-950/95 shadow-sm">
      {/* Top Bar */}
      <div className="hidden md:block border-b border-zinc-100 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-8 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {t('common.nationalEncyclopedia')}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span>{t('common.lastUpdate')}: {new Date().toLocaleDateString(currentLang === 'ar' ? 'ar-YE' : 'en-US')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - GOVERNANCE: Simple zinc logo, no flag colors */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center"
            >
              <div className="w-10 h-10 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                <span className="text-lg font-bold text-zinc-100 dark:text-zinc-900">Y</span>
              </div>
              <div className={`${dir === 'rtl' ? 'mr-3' : 'ml-3'}`}>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  Yemenpedia
                </h1>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 tracking-wide">
                  {t('common.nationalEncyclopedia')}
                </p>
              </div>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              if (item.hasDropdown) {
                return (
                  <DropdownMenu key={item.name}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-1 px-4 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500">
                        {item.name}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={dir === 'rtl' ? 'end' : 'start'} className="w-72 p-2">
                      <div className="grid grid-cols-2 gap-1">
                        {mainCategories.map((cat) => (
                          <DropdownMenuItem key={cat.slug} asChild>
                            <Link href={`/category/${cat.slug}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500">
                              <cat.icon className="h-4 w-4 text-zinc-500" />
                              <span className="text-sm">{cat.name}</span>
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </div>
                      <DropdownMenuSeparator className="my-2" />
                      <DropdownMenuItem asChild>
                        <Link href="/categories" className="w-full text-center text-zinc-900 dark:text-zinc-100 font-medium">
                          {t('common.allCategories')}
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }
              return (
                <Link key={item.name} href={item.href}>
                  <Button variant="ghost" className="flex items-center gap-2 px-4 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500">
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Search */}
          <div className="hidden md:flex items-center">
            <motion.div 
              className="relative"
              animate={{ width: isSearchOpen ? 300 : 200 }}
              transition={{ duration: 0.3 }}
            >
              <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400`} />
              <Input
                type="search"
                placeholder={t('common.search')}
                className={`w-full ${dir === 'rtl' ? 'pr-10' : 'pl-10'} bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:border-zinc-400 focus:ring-2 focus:ring-blue-500`}
                onFocus={() => setIsSearchOpen(true)}
                onBlur={() => setIsSearchOpen(false)}
              />
            </motion.div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative gap-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500">
                  <Globe className="h-5 w-5" />
                  <span className="sr-only">{t('common.changeLanguage')}</span>
                  <span className="absolute -bottom-0.5 -left-0.5 text-[8px] font-bold bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded px-0.5">
                    {currentLang.toUpperCase()}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => onLanguageChange(lang.code)}
                    className={`flex items-center justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 ${currentLang === lang.code ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : ''}`}
                  >
                    <span>{lang.name}</span>
                    {currentLang === lang.code && (
                      <Check className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onThemeToggle}
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
              <span className="sr-only">{t('common.toggleTheme')}</span>
            </Button>

            {/* Auth Section */}
            {isAuthenticated && user ? (
              <>
                {/* Notifications Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -left-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 border-2 border-zinc-50 dark:border-zinc-950">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-0">
                    <div className="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-zinc-800">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-50">{t('common.notifications')}</span>
                      {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-blue-500">
                          {t('common.markAllRead')}
                        </Button>
                      )}
                    </div>
                    <ScrollArea className="h-80">
                      {isLoadingNotifications ? (
                        <div className="flex items-center justify-center p-8">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-zinc-500 dark:text-zinc-400">
                          <Bell className="h-10 w-10 mb-2 opacity-30" />
                          <p>{t('common.noNotifications')}</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => !notification.isRead && markAsRead(notification.id)}
                            className={`p-3 border-b last:border-0 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${!notification.isRead ? 'bg-zinc-100/50 dark:bg-zinc-800/50' : ''}`}
                          >
                            <div className="flex items-start gap-2">
                              {!notification.isRead && (
                                <span className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100 mt-2 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                  {timeAgo(notification.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </ScrollArea>
                    <div className="p-2 border-t border-zinc-200 dark:border-zinc-800">
                      <Link href="/dashboard/notifications">
                        <Button variant="ghost" className="w-full text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-blue-500">
                          {t('common.viewAllNotifications')}
                        </Button>
                      </Link>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500">
                      <Avatar className="h-8 w-8 ring-2 ring-zinc-200 dark:ring-zinc-700">
                        {user.image ? (
                          <AvatarImage src={user.image} alt={user.name} />
                        ) : null}
                        <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm">
                          {user.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline text-zinc-700 dark:text-zinc-300">{user.name}</span>
                      <ChevronDown className="h-4 w-4 text-zinc-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="p-2 border-b border-zinc-200 dark:border-zinc-800">
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">{user.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">@{user.username || 'user'}</p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500">
                        <BookOpen className="h-4 w-4" />
                        {t('common.dashboard')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/write" className="flex items-center gap-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500">
                        <PenTool className="h-4 w-4" />
                        {t('common.writeArticle')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link 
                        href={user.username ? `/u/${user.username}` : '/dashboard'}
                        className="flex items-center gap-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <User className="h-4 w-4" />
                        {t('common.profile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="flex items-center gap-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500">
                        <Settings className="h-4 w-4" />
                        {t('common.settings')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-zinc-600 dark:text-zinc-400 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500"
                      onClick={onLogout}
                    >
                      <LogOut className={`h-4 w-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                      {t('common.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500">
                    {t('common.login')}
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-blue-500">
                    {t('common.register')}
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
          >
            <div className="container mx-auto px-4 py-4">
              {/* Mobile Search */}
              <div className="relative mb-4">
                <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400`} />
                <Input
                  type="search"
                  placeholder={t('common.search')}
                  className={`w-full ${dir === 'rtl' ? 'pr-10' : 'pl-10'} bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700`}
                />
              </div>

              {/* Mobile Nav Items */}
              <div className="flex flex-col gap-1 mb-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus-visible:ring-2 focus-visible:ring-blue-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5 text-zinc-500" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>

              {/* Mobile Categories */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-3">{t('nav.categories')}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {mainCategories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/category/${cat.slug}`}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus-visible:ring-2 focus-visible:ring-blue-500"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <cat.icon className="h-4 w-4 text-zinc-500" />
                      <span className="text-sm">{cat.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

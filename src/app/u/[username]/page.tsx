'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AtSign, Camera, Twitter, Facebook, Linkedin, Instagram,
  Globe, Calendar, Edit2, MoreHorizontal, Settings, Share2,
  Menu, X, LogOut, LayoutDashboard, FileText, PenTool, 
  FolderTree, Bell, MessageSquare, User, ChevronLeft, ImagePlus,
  Crown, Diamond, Medal, Sprout
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ImageCropPreview } from '@/components/profile/ImageCropPreview'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAuth } from '@/contexts/AuthContext'

// Sidebar items - will include notification count
const getSidebarItems = (notificationCount: number = 0) => [
  { name: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
  { name: 'مقالاتي', href: '/dashboard/articles', icon: FileText },
  { name: 'كتابة مقال', href: '/dashboard/write', icon: PenTool },
  { name: 'الأقسام', href: '/dashboard/categories', icon: FolderTree },
  { name: 'الإشعارات', href: '/dashboard/notifications', icon: Bell, badge: notificationCount },
  { name: 'الرسائل', href: '/dashboard/messages', icon: MessageSquare },
  { name: 'الملف الشخصي', href: '/dashboard/profile', icon: User },
  { name: 'الإعدادات', href: '/dashboard/settings', icon: Settings },
]

interface Article {
  id: string
  title: string
  slug: string
  excerpt?: string
  viewCount: number
  likeCount: number
  createdAt: string
  category?: { name: string; slug: string }
}

interface PublicUser {
  id: string
  name: string
  username: string
  image?: string
  coverImage?: string
  bio?: string
  location?: string
  website?: string
  role: string
  points: number
  isVerified: boolean
  createdAt: string
  articleCount: number
  followersCount: number
  followingCount: number
  isFollowing: boolean
  verificationStatus?: string | null
  socialLinks?: {
    twitter?: string
    facebook?: string
    linkedin?: string
    instagram?: string
  }
  badges: Array<{
    badgeType: string
    earnedAt: string
  }>
  articles: Article[]
}

const badgeLabels: Record<string, string> = {
  CONTRIBUTOR: 'مساهم',
  ACTIVE_WRITER: 'كاتب نشط',
  EXPERT_WRITER: 'كاتب خبير',
  VERIFIED_AUTHOR: 'كاتب موثق',
  TOP_CONTRIBUTOR: 'أفضل مساهم',
  PIONEER: 'رائد',
  REVIEWER: 'مراجع',
  SUPERVISOR_BADGE: 'شارة المشرف'
}

const roleLabels: Record<string, string> = {
  ADMIN: 'مدير',
  VERIFIER: 'محقق',
  SUPERVISOR: 'مشرف',
  WRITER: 'كاتب',
  VISITOR: 'زائر'
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-zinc-600',
  VERIFIER: 'bg-emerald-600',
  SUPERVISOR: 'bg-sky-600',
  WRITER: 'bg-violet-600',
  VISITOR: 'bg-zinc-600'
}

const badgeColors: Record<string, string> = {
  CONTRIBUTOR: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  ACTIVE_WRITER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  EXPERT_WRITER: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  VERIFIED_AUTHOR: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  TOP_CONTRIBUTOR: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  PIONEER: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  REVIEWER: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  SUPERVISOR_BADGE: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-300'
}

const avatarColors = [
  'from-rose-400 to-rose-600',
  'from-orange-400 to-orange-600',
  'from-amber-400 to-amber-600',
  'from-emerald-400 to-emerald-600',
  'from-teal-400 to-teal-600',
  'from-cyan-400 to-cyan-600',
  'from-sky-400 to-sky-600',
  'from-violet-400 to-violet-600',
  'from-purple-400 to-purple-600',
  'from-fuchsia-400 to-fuchsia-600',
]

const coverGradients = [
  'from-rose-500 via-pink-500 to-fuchsia-600',
  'from-orange-500 via-zinc-500 to-rose-600',
  'from-amber-500 via-orange-500 to-zinc-600',
  'from-emerald-500 via-teal-500 to-cyan-600',
  'from-teal-500 via-cyan-500 to-sky-600',
  'from-cyan-500 via-sky-500 to-blue-600',
  'from-sky-500 via-blue-500 to-indigo-600',
  'from-violet-500 via-purple-500 to-fuchsia-600',
  'from-purple-500 via-fuchsia-500 to-pink-600',
]

function getAvatarColor(id: string): string {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return avatarColors[hash % avatarColors.length]
}

function getCoverGradient(id: string): string {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return coverGradients[hash % coverGradients.length]
}

function getLevel(points: number) {
  if (points >= 1000) return { name: 'أسطوري', icon: Crown, min: 1000, max: 9999, color: 'from-yellow-400 to-amber-500' }
  if (points >= 500) return { name: 'خبير', icon: Diamond, min: 500, max: 999, color: 'from-violet-400 to-purple-500' }
  if (points >= 200) return { name: 'متقدم', icon: Medal, min: 200, max: 499, color: 'from-amber-300 to-yellow-400' }
  if (points >= 100) return { name: 'نشط', icon: Medal, min: 100, max: 199, color: 'from-slate-300 to-zinc-400' }
  if (points >= 50) return { name: 'مبتدئ', icon: Medal, min: 50, max: 99, color: 'from-orange-300 to-amber-400' }
  return { name: 'جديد', icon: Sprout, min: 0, max: 49, color: 'from-green-400 to-emerald-500' }
}

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  
  // Use AuthContext instead of localStorage
  const { user: currentUser, isLoading: authLoading, logout, refreshUser } = useAuth()
  
  const [user, setUser] = useState<PublicUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  // Edit states
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '', username: '', bio: '', location: '', website: '',
    twitter: '', facebook: '', linkedin: '', instagram: ''
  })

  // Image crop states
  const [showCropPreview, setShowCropPreview] = useState(false)
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  const [pendingImageType, setPendingImageType] = useState<'avatar' | 'cover'>('avatar')

  // Follow state
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [isFollowLoading, setIsFollowLoading] = useState(false)

  // Verification dialog
  const [showVerificationDialog, setShowVerificationDialog] = useState(false)
  const [verificationReason, setVerificationReason] = useState('')
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false)

  // Notifications
  const [notificationCount, setNotificationCount] = useState(0)

  const isOwner = currentUser?.id === user?.id || currentUser?.username === user?.username
  const isLoggedIn = !!currentUser

  useEffect(() => {
    // Fetch notification count when currentUser is available
    if (currentUser) {
      fetch(`/api/notifications?userId=${currentUser.id}&unreadOnly=true&limit=0`)
        .then(res => res.json())
        .then(data => {
          if (data.unreadCount !== undefined) {
            setNotificationCount(data.unreadCount)
          }
        })
        .catch(console.error)
    }

    // Fetch profile user
    const fetchUser = async () => {
      try {
        const currentUserId = currentUser?.id
        const res = await fetch(`/api/profile/${username}${currentUserId ? `?currentUserId=${currentUserId}` : ''}`)
        const data = await res.json()

        if (res.ok) {
          setUser(data.user)
          setIsFollowing(data.user.isFollowing)
          setFollowersCount(data.user.followersCount)
        } else {
          setError(data.error || 'المستخدم غير موجود')
        }
      } catch {
        setError('حدث خطأ في تحميل الصفحة')
      } finally {
        setIsLoading(false)
      }
    }

    if (username) {
      fetchUser()
    }
  }, [username, currentUser?.id])

  const openEditDialog = () => {
    if (!user) return
    const s = user.socialLinks || {}
    setEditForm({
      name: user.name || '', username: user.username || '', bio: user.bio || '',
      location: user.location || '', website: user.website || '',
      twitter: s.twitter || '', facebook: s.facebook || '',
      linkedin: s.linkedin || '', instagram: s.instagram || ''
    })
    setShowEditDialog(true)
  }

  // Handle avatar select
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'اختر صورة صالحة' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'الحجم يجب أن يكون أقل من 10MB' })
      return
    }
    setPendingImageFile(file)
    setPendingImageType('avatar')
    setShowCropPreview(true)
  }

  // Handle cover select
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'اختر صورة صالحة' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'الحجم يجب أن يكون أقل من 10MB' })
      return
    }
    setPendingImageFile(file)
    setPendingImageType('cover')
    setShowCropPreview(true)
  }

  // Confirm crop and upload
  const handleCropConfirm = async (cropData: { x: number; y: number; width: number; height: number }) => {
    if (!pendingImageFile || !user) return
    
    const isAvatar = pendingImageType === 'avatar'
    const setUploading = isAvatar ? setIsUploadingImage : setIsUploadingCover
    
    setUploading(true)
    setShowCropPreview(false)
    
    try {
      const fd = new FormData()
      fd.append('file', pendingImageFile)
      fd.append('imageType', pendingImageType)
      fd.append('cropX', cropData.x.toString())
      fd.append('cropY', cropData.y.toString())
      fd.append('cropWidth', cropData.width.toString())
      fd.append('cropHeight', cropData.height.toString())

      const res = await fetch('/api/image-optimize', { method: 'POST', body: fd })
      const data = await res.json()

      if (res.ok && data.url) {
        const updateData = isAvatar 
          ? { userId: user.id, image: data.url }
          : { userId: user.id, coverImage: data.url }

        const updateRes = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        })

        if (updateRes.ok) {
          const updatedUser = isAvatar 
            ? { ...user, image: data.url }
            : { ...user, coverImage: data.url }
          setUser(updatedUser)

          // Refresh user data in auth context to update the avatar
          if (isAvatar) {
            await refreshUser()
          }

          toast({ 
            title: 'تم', 
            description: isAvatar ? 'تم تغيير صورة البروفايل' : 'تم تغيير صورة الغلاف',
            duration: 3000
          })
        } else throw new Error((await updateRes.json()).error || 'فشل الحفظ')
      } else throw new Error(data.error || 'فشل معالجة الصورة')
    } catch (error) {
      toast({ variant: 'destructive', title: 'خطأ', description: error instanceof Error ? error.message : 'حدث خطأ' })
    } finally {
      setUploading(false)
      setPendingImageFile(null)
    }
  }

  const handleCropCancel = () => {
    setShowCropPreview(false)
    setPendingImageFile(null)
  }

  const handleSaveEdit = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id, name: editForm.name, bio: editForm.bio,
          location: editForm.location, website: editForm.website,
          socialLinks: { twitter: editForm.twitter || undefined, facebook: editForm.facebook || undefined, linkedin: editForm.linkedin || undefined, instagram: editForm.instagram || undefined }
        })
      })
      if (res.ok) {
        const updatedUser = { 
          ...user, 
          name: editForm.name, 
          bio: editForm.bio, 
          location: editForm.location, 
          website: editForm.website, 
          socialLinks: { twitter: editForm.twitter, facebook: editForm.facebook, linkedin: editForm.linkedin, instagram: editForm.instagram } 
        }
        setUser(updatedUser)
        setShowEditDialog(false)
        toast({ title: 'تم الحفظ', description: 'تم تحديث الملف الشخصي' })
      } else throw new Error((await res.json()).error || 'فشل الحفظ')
    } catch (error) {
      toast({ variant: 'destructive', title: 'خطأ', description: error instanceof Error ? error.message : 'حدث خطأ' })
    } finally { setIsSaving(false) }
  }

  // Handle follow/unfollow
  const handleFollow = async () => {
    if (!currentUser || !user) return
    
    setIsFollowLoading(true)
    try {
      const res = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: currentUser.id, followingId: user.id })
      })
      const data = await res.json()
      if (res.ok) {
        setIsFollowing(data.isFollowing)
        setFollowersCount(data.followersCount)
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'حدث خطأ' })
    } finally {
      setIsFollowLoading(false)
    }
  }

  // Handle verification request
  const handleVerificationRequest = async () => {
    if (!user || !verificationReason.trim()) return
    
    setIsSubmittingVerification(true)
    try {
      const res = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, reason: verificationReason })
      })
      const data = await res.json()
      
      if (res.ok) {
        toast({ title: 'تم الإرسال', description: 'تم تقديم طلب التوثيق بنجاح' })
        setShowVerificationDialog(false)
        setVerificationReason('')
        setUser({ ...user, verificationStatus: 'PENDING' })
      } else {
        toast({ variant: 'destructive', title: 'خطأ', description: data.error })
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'حدث خطأ' })
    } finally {
      setIsSubmittingVerification(false)
    }
  }

  const shareProfile = async () => {
    if (!user) return
    const url = window.location.href
    try {
      await navigator.share({
        title: `${user.name || user.username} - يمنبيديا`,
        url
      })
    } catch {
      navigator.clipboard.writeText(url)
      toast({ title: 'تم النسخ', description: 'تم نسخ رابط الملف' })
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  // Show loading state while either profile data or auth is loading
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-zinc-500">جارٍ تحميل الملف الشخصي...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-900">
        <Card className="max-w-md w-full text-center border-0 shadow-xl">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AtSign className="h-8 w-8 text-zinc-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">المستخدم غير موجود</h1>
            <p className="text-zinc-500 mb-6">@{username} غير مسجل في يمنبيديا</p>
            <Link href="/">
              <Button className="bg-zinc-600 hover:bg-zinc-700 rounded-full px-8 focus-visible:ring-2 focus-visible:ring-blue-500">العودة للرئيسية</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const joinDate = new Date(user.createdAt)
  const formattedJoinDate = joinDate.toLocaleDateString('ar-YE', { year: 'numeric', month: 'long' })
  const level = getLevel(user.points || 0)
  const coverGradient = getCoverGradient(user.id)
  const avatarColor = getAvatarColor(user.id)

  // Calculate progress percentage
  const progressPercent = Math.min(100, ((user.points - level.min) / (level.max - level.min + 1)) * 100)

  // Sidebar Component
  const Sidebar = () => (
    <aside className={cn(
      "fixed top-0 right-0 z-40 h-full w-72 bg-white dark:bg-zinc-800 shadow-xl transition-transform duration-300 lg:translate-x-0",
      isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
    )}>
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-700">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden ring-2 ring-zinc-500/20">
              <div className="h-1/3 bg-[#CE1126]" />
              <div className="h-1/3 bg-white" />
              <div className="h-1/3 bg-black" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-600">Yemenpedia</h1>
              <p className="text-xs text-zinc-500">لوحة التحكم</p>
            </div>
          </Link>
        </div>

        {currentUser && (
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-zinc-500/20">
                <AvatarImage src={currentUser.image || ''} />
                <AvatarFallback className="bg-zinc-600 text-white">{currentUser.name?.charAt(0) || 'ي'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{currentUser.name}</p>
                <p className="text-xs text-zinc-500 flex items-center gap-1">
                  <AtSign className="h-3 w-3" />{currentUser.username}
                </p>
              </div>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 p-4">
          <nav className="space-y-1">
            {getSidebarItems(notificationCount).map((item) => (
              <Link key={item.href} href={item.href}>
                <motion.div whileHover={{ x: -4 }} className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                  "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                )}>
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="mr-auto bg-zinc-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </motion.div>
              </Link>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-700">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start text-zinc-600 focus-visible:ring-2 focus-visible:ring-blue-500">
              <ChevronLeft className="ml-2 h-4 w-4" />العودة للموقع
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start text-zinc-600 hover:text-zinc-700 hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-blue-500" onClick={handleLogout}>
            <LogOut className="ml-2 h-4 w-4" />تسجيل الخروج
          </Button>
        </div>
      </div>
    </aside>
  )

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        {/* Mobile Toggle */}
        {isLoggedIn && (
          <Button variant="ghost" size="icon" className="fixed top-4 right-4 z-50 lg:hidden bg-white dark:bg-zinc-800 shadow-lg focus-visible:ring-2 focus-visible:ring-blue-500" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        )}

        {isLoggedIn && <Sidebar />}

        <div className={cn(isLoggedIn && "lg:mr-72")}>
          {/* Cover Photo */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-48 md:h-64 relative overflow-hidden group rounded-b-3xl">
            {user.coverImage ? (
              <img src={user.coverImage} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${coverGradient}`} />
            )}
            
            {/* Cover Edit Button */}
            {isOwner && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => coverInputRef.current?.click()}
                disabled={isUploadingCover}
                className="absolute top-4 left-4 bg-black/60 hover:bg-black/80 text-white rounded-xl px-4 py-2 shadow-lg transition-all flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100"
              >
                {isUploadingCover ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-white" />
                ) : (
                  <ImagePlus className="h-5 w-5" />
                )}
                <span className="text-sm font-medium hidden sm:inline">تغيير الغلاف</span>
              </motion.button>
            )}
            <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
          </motion.div>

          {/* Main Content */}
          <div className="max-w-3xl mx-auto px-4 -mt-20 md:-mt-28">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Profile Card */}
              <Card className="border-0 shadow-xl overflow-visible bg-white dark:bg-zinc-800">
                <CardContent className="pt-20 md:pt-24 pb-6">
                  {/* Avatar + Actions Row */}
                  <div className="flex flex-col md:flex-row items-start gap-4">
                    {/* Avatar */}
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative -mt-28 md:-mt-32">
                      <div className="p-1 bg-white dark:bg-zinc-800 rounded-full">
                        <Avatar className="h-28 w-28 md:h-36 md:w-36 ring-4 ring-white dark:ring-zinc-800 shadow-xl">
                          <AvatarImage src={user.image || ''} />
                          <AvatarFallback className={`bg-gradient-to-br ${avatarColor} text-white text-5xl font-bold`}>
                            {user.name?.charAt(0) || user.username?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      {isOwner && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingImage}
                          className="absolute bottom-2 left-2 bg-black/80 hover:bg-black text-white rounded-full p-3 shadow-lg transition-all"
                        >
                          {isUploadingImage ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-white" />
                          ) : (
                            <Camera className="h-5 w-5" />
                          )}
                        </motion.button>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
                    </motion.div>

                    {/* Actions */}
                    <div className="flex-1 flex justify-end gap-2 mt-4 md:mt-0">
                      {isOwner ? (
                        <>
                          <Button onClick={openEditDialog} className="rounded-full bg-zinc-600 hover:bg-zinc-700 text-white shadow-lg focus-visible:ring-2 focus-visible:ring-blue-500">
                            <Edit2 className="h-4 w-4 ml-2" />تعديل الملف
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon" className="rounded-full shadow-md focus-visible:ring-2 focus-visible:ring-blue-500">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                              <DropdownMenuItem onClick={shareProfile}>
                                <Share2 className="h-4 w-4 ml-2" />نسخ رابط الملف
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href="/dashboard/settings">
                                  <Settings className="h-4 w-4 ml-2" />الإعدادات المتقدمة
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      ) : currentUser ? (
                        <Button onClick={handleFollow} disabled={isFollowLoading} className={cn(
                          "rounded-full shadow-lg min-w-[120px] focus-visible:ring-2 focus-visible:ring-blue-500",
                          isFollowing ? "bg-zinc-200 text-zinc-800 hover:bg-zinc-300" : "bg-zinc-600 hover:bg-zinc-700 text-white"
                        )}>
                          {isFollowLoading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : isFollowing ? 'متابَع' : 'متابعة'}
                        </Button>
                      ) : (
                        <Button variant="outline" size="icon" onClick={shareProfile} className="rounded-full shadow-md focus-visible:ring-2 focus-visible:ring-blue-500">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="mt-4">
                    {/* Name + Verification */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">
                        {user.name || user.username}
                      </h1>
                      
                      {/* Verification Badge */}
                      {user.isVerified ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>موثق من الإدارة</TooltipContent>
                        </Tooltip>
                      ) : isOwner && user.verificationStatus !== 'PENDING' ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => setShowVerificationDialog(true)} className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-zinc-300 text-zinc-400 hover:border-emerald-500 hover:text-emerald-500 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>توثيق حسابك</TooltipContent>
                        </Tooltip>
                      ) : null}

                      {/* Pending verification indicator for owner */}
                      {isOwner && user.verificationStatus === 'PENDING' && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">طلب قيد المراجعة</span>
                      )}
                    </div>

                    {/* Username */}
                    <p className="text-zinc-500 mt-1">@{user.username}</p>

                    {/* Role + Badges */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge className={`${roleColors[user.role] || 'bg-zinc-600'} text-white`}>
                        {roleLabels[user.role] || user.role}
                      </Badge>
                      {user.badges.slice(0, 3).map((badge, i) => (
                        <Badge key={i} className={badgeColors[badge.badgeType] || 'bg-zinc-100 text-zinc-700'}>
                          {badgeLabels[badge.badgeType] || badge.badgeType}
                        </Badge>
                      ))}
                    </div>

                    {/* Bio */}
                    {user.bio && (
                      <p className="text-zinc-700 dark:text-zinc-300 mt-4 leading-relaxed">{user.bio}</p>
                    )}

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-sm text-zinc-500">
                      {user.location && <span>{user.location}</span>}
                      {user.location && (user.website || user.createdAt) && <span className="text-zinc-300">•</span>}
                      {user.website && (
                        <a href={user.website.startsWith('http') ? user.website : `https://${user.website}`} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">
                          {user.website.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                      {user.website && user.createdAt && <span className="text-zinc-300">•</span>}
                      {user.createdAt && <span>انضم {formattedJoinDate}</span>}
                    </div>

                    {/* Social Links */}
                    {user.socialLinks && Object.values(user.socialLinks).some(Boolean) && (
                      <div className="flex gap-2 mt-4">
                        {user.socialLinks.twitter && (
                          <a href={`https://twitter.com/${user.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-sky-50 dark:bg-sky-900/20 text-sky-500 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors">
                            <Twitter className="h-4 w-4" />
                          </a>
                        )}
                        {user.socialLinks.facebook && (
                          <a href={`https://facebook.com/${user.socialLinks.facebook}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                            <Facebook className="h-4 w-4" />
                          </a>
                        )}
                        {user.socialLinks.linkedin && (
                          <a href={`https://linkedin.com/in/${user.socialLinks.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                            <Linkedin className="h-4 w-4" />
                          </a>
                        )}
                        {user.socialLinks.instagram && (
                          <a href={`https://instagram.com/${user.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-500 hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors">
                            <Instagram className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Level Progress */}
                  <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium flex items-center gap-1"><level.icon className="h-4 w-4" /> {level.name}</span>
                      <span className="text-sm text-zinc-500">{user.points} نقطة</span>
                    </div>
                    <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1 }}
                        className={`h-full bg-gradient-to-r ${level.color} rounded-full`}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-center gap-6 mt-4 py-4 border-t border-b border-zinc-100 dark:border-zinc-700">
                    <div className="text-center">
                      <p className="text-xl font-bold text-zinc-900 dark:text-white">{user.articleCount}</p>
                      <p className="text-sm text-zinc-500">مقالة</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-zinc-900 dark:text-white">{followersCount}</p>
                      <p className="text-sm text-zinc-500">متابع</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-zinc-900 dark:text-white">{user.followingCount}</p>
                      <p className="text-sm text-zinc-500">متابَع</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Articles Section */}
              {user.articles && user.articles.length > 0 && (
                <Card className="border-0 shadow-xl bg-white dark:bg-zinc-800">
                  <CardContent className="pt-6">
                    <h2 className="text-lg font-bold mb-4">آخر المقالات</h2>
                    <div className="space-y-4">
                      {user.articles.map((article) => (
                        <Link key={article.id} href={`/article/${article.slug}`}>
                          <motion.div whileHover={{ x: -4 }} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                            <h3 className="font-medium text-zinc-900 dark:text-white mb-1">{article.title}</h3>
                            {article.excerpt && <p className="text-sm text-zinc-500 line-clamp-2 mb-2">{article.excerpt}</p>}
                            <div className="flex items-center gap-4 text-xs text-zinc-400">
                              {article.category && <span>{article.category.name}</span>}
                              <span>{new Date(article.createdAt).toLocaleDateString('ar-YE')}</span>
                            </div>
                          </motion.div>
                        </Link>
                      ))}
                    </div>
                    {user.articleCount > 3 && (
                      <Link href={`/u/${user.username}/articles`} className="block mt-4 text-center text-zinc-600 hover:text-zinc-700 font-medium focus-visible:ring-2 focus-visible:ring-blue-500">
                        عرض جميع المقالات ({user.articleCount})
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>تعديل الملف الشخصي</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>الاسم</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>النبذة</Label>
                <Textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} className="mt-1" rows={3} />
              </div>
              <div>
                <Label>الموقع</Label>
                <Input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>الموقع الإلكتروني</Label>
                <Input value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} className="mt-1" dir="ltr" />
              </div>
              <div className="pt-4 border-t">
                <Label className="mb-2 block">روابط التواصل</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Twitter" value={editForm.twitter} onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })} dir="ltr" />
                  <Input placeholder="Facebook" value={editForm.facebook} onChange={(e) => setEditForm({ ...editForm, facebook: e.target.value })} dir="ltr" />
                  <Input placeholder="LinkedIn" value={editForm.linkedin} onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })} dir="ltr" />
                  <Input placeholder="Instagram" value={editForm.instagram} onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })} dir="ltr" />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">إلغاء</Button>
                <Button onClick={handleSaveEdit} disabled={isSaving} className="flex-1 bg-zinc-600 hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-blue-500">
                  {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Verification Request Dialog */}
        <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>طلب توثيق الحساب</DialogTitle>
              <DialogDescription>
                قدم طلباً للحصول على شارة التوثيق. سيتم مراجعة طلبك من قبل الإدارة.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <Label>سبب طلب التوثيق</Label>
              <Textarea
                value={verificationReason}
                onChange={(e) => setVerificationReason(e.target.value)}
                placeholder="مثال: كاتب صحفي معروف، شخصية عامة، صاحب موقع معتمد..."
                className="mt-1"
                rows={4}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowVerificationDialog(false)} className="flex-1">إلغاء</Button>
              <Button onClick={handleVerificationRequest} disabled={isSubmittingVerification || !verificationReason.trim()} className="flex-1 bg-zinc-600 hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-blue-500">
                {isSubmittingVerification ? 'جاري الإرسال...' : 'إرسال الطلب'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Crop Preview */}
        <AnimatePresence>
          {showCropPreview && pendingImageFile && (
            <ImageCropPreview
              file={pendingImageFile}
              imageType={pendingImageType}
              onConfirm={handleCropConfirm}
              onCancel={handleCropCancel}
            />
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}

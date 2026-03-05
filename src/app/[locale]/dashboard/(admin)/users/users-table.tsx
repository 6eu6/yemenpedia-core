'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreVertical,
  Shield,
  Eye,
  Edit,
  Mail,
  UserX,
  UserCheck,
} from 'lucide-react'
import {
  type RoleName,
  ROLE_NAMES,
  ROLE_INFO,
  getAllRoles,
  isValidRole,
} from '@/config/roles.config'

interface User {
  id: string
  name: string | null
  username: string | null
  email: string
  role: string
  isActive: boolean
  isBanned: boolean
  isVerified: boolean
  createdAt: Date
  lastLoginAt: Date | null
}

// Get role color from config
const getRoleColor = (role: string): string => {
  if (!isValidRole(role)) return 'bg-zinc-100 text-zinc-800'
  const info = ROLE_INFO[role as RoleName]
  return `${info.color} text-white`
}

// Get role label from config
const getRoleLabel = (role: string): string => {
  if (!isValidRole(role)) return role
  return ROLE_INFO[role as RoleName].name
}

interface UsersTableProps {
  users: User[]
}

export function UsersTable({ users }: UsersTableProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleRoleChange = async (userId: string, newRole: RoleName) => {
    setIsLoading(userId)
    try {
      const res = await fetch('/api/admin/users/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })

      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update role:', error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleBan = async (userId: string, ban: boolean) => {
    setIsLoading(userId)
    try {
      const res = await fetch('/api/admin/users/ban', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isBanned: ban }),
      })

      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update ban status:', error)
    } finally {
      setIsLoading(null)
    }
  }

  // Get all available roles for the dropdown
  const availableRoles = getAllRoles()

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>المستخدم</TableHead>
            <TableHead>البريد الإلكتروني</TableHead>
            <TableHead>الدور</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>تاريخ التسجيل</TableHead>
            <TableHead>آخر دخول</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-medium">
                    {user.name?.charAt(0) || user.username?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-medium">{user.name || user.username}</p>
                    <p className="text-sm text-zinc-500">@{user.username}</p>
                  </div>
                  {user.isVerified && (
                    <UserCheck className="h-4 w-4 text-emerald-500" />
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm">{user.email}</TableCell>
              <TableCell>
                <Badge className={getRoleColor(user.role)}>
                  {getRoleLabel(user.role)}
                </Badge>
              </TableCell>
              <TableCell>
                {user.isBanned ? (
                  <Badge variant="destructive">محظور</Badge>
                ) : user.isActive ? (
                  <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                    نشط
                  </Badge>
                ) : (
                  <Badge variant="secondary">غير نشط</Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-zinc-500">
                {new Date(user.createdAt).toLocaleDateString('ar')}
              </TableCell>
              <TableCell className="text-sm text-zinc-500">
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleDateString('ar')
                  : 'لم يسجل دخول'}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 focus-visible:ring-2 focus-visible:ring-blue-500">
                      {isLoading === user.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                      ) : (
                        <MoreVertical className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500">
                      <Eye className="ml-2 h-4 w-4" />
                      عرض الملف
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500">
                      <Mail className="ml-2 h-4 w-4" />
                      إرسال رسالة
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {availableRoles.map((role) => (
                      <DropdownMenuItem
                        key={role}
                        onClick={() => handleRoleChange(user.id, role)}
                        className="cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <Shield className="ml-2 h-4 w-4" />
                        تعيين كـ {ROLE_INFO[role].name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    {user.isBanned ? (
                      <DropdownMenuItem onClick={() => handleBan(user.id, false)} className="cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500">
                        <UserCheck className="ml-2 h-4 w-4" />
                        إلغاء الحظر
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => handleBan(user.id, true)}
                        className="text-red-600 dark:text-red-400 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <UserX className="ml-2 h-4 w-4" />
                        حظر المستخدم
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

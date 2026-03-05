'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Role } from '@prisma/client'
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
  MoreHorizontal,
  Shield,
  MoreVertical,
  Ban,
  CheckCircle,
  Eye,
  Edit,
  Mail,
  UserX,
  UserCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface User {
  id: string
  name: string | null
  username: string | null
  email: string
  role: Role
  isActive: boolean
  isBanned: boolean
  isVerified: boolean
  createdAt: Date
  lastLoginAt: Date | null
}

const roleColors: Record<Role, string> = {
  ADMIN: 'bg-zinc-800 text-white',
  MODERATOR: 'bg-emerald-100 text-emerald-800',
  EDITOR: 'bg-sky-100 text-sky-800',
  MEMBER: 'bg-zinc-100 text-zinc-800',
}

const roleLabels: Record<Role, string> = {
  ADMIN: 'مدير',
  MODERATOR: 'مشرف',
  EDITOR: 'محرر',
  MEMBER: 'عضو',
}

interface UsersTableProps {
  users: User[]
}

export function UsersTable({ users }: UsersTableProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleRoleChange = async (userId: string, newRole: Role) => {
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
                  <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-sm font-medium">
                    {user.name?.charAt(0) || user.username?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-medium">{user.name || user.username}</p>
                    <p className="text-sm text-zinc-500">@{user.username}</p>
                  </div>
                  {user.isVerified && (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm">{user.email}</TableCell>
              <TableCell>
                <Badge className={roleColors[user.role]}>
                  {roleLabels[user.role]}
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
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="ml-2 h-4 w-4" />
                      عرض الملف
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Mail className="ml-2 h-4 w-4" />
                      إرسال رسالة
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'MODERATOR')}>
                      <Shield className="ml-2 h-4 w-4" />
                      تعيين كمشرف
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'EDITOR')}>
                      <Edit className="ml-2 h-4 w-4" />
                      تعيين كمحرر
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'MEMBER')}>
                      <UserCheck className="ml-2 h-4 w-4" />
                      تعيين كعضو
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {user.isBanned ? (
                      <DropdownMenuItem onClick={() => handleBan(user.id, false)}>
                        <UserCheck className="ml-2 h-4 w-4" />
                        إلغاء الحظر
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem 
                        onClick={() => handleBan(user.id, true)}
                        className="text-red-600"
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

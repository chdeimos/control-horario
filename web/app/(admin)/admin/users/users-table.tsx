'use client'

import { useState, useMemo } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    MoreHorizontal,
    Key,
    ChevronUp,
    ChevronDown,
    Building2,
    Mail,
    UserCircle,
    Loader2
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner'
import { sendUserResetEmail, toggleUserStatus } from './actions'

interface UserProfile {
    id: string
    full_name: string
    email: string
    role: string
    is_active: boolean
    created_at: string
    companies: {
        name: string
    } | null
}

export function UsersTable({ initialUsers }: { initialUsers: UserProfile[] }) {
    const [filter, setFilter] = useState('')
    const [sortConfig, setSortConfig] = useState<{ key: keyof UserProfile | 'company_name', direction: 'asc' | 'desc' } | null>(null)
    const [users, setUsers] = useState(initialUsers)
    const [isPending, setIsPending] = useState(false)

    // Confirmation Dialog State
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)

    const handleSort = (key: keyof UserProfile | 'company_name') => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const filteredAndSortedUsers = useMemo(() => {
        let result = [...users]
        if (filter) {
            const lowerFilter = filter.toLowerCase()
            result = result.filter(u =>
                u.full_name?.toLowerCase().includes(lowerFilter) ||
                u.email?.toLowerCase().includes(lowerFilter) ||
                u.companies?.name?.toLowerCase().includes(lowerFilter)
            )
        }
        if (sortConfig) {
            result.sort((a, b) => {
                let valA: any = sortConfig.key === 'company_name' ? (a.companies?.name || '') : (a[sortConfig.key as keyof UserProfile] || '')
                let valB: any = sortConfig.key === 'company_name' ? (b.companies?.name || '') : (b[sortConfig.key as keyof UserProfile] || '')
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            })
        }
        return result
    }, [users, filter, sortConfig])

    const handleSendResetEmail = async (email: string) => {
        toast.promise(sendUserResetEmail(email), {
            loading: 'Enviando correo de restablecimiento...',
            success: 'Correo enviado correctamente al usuario',
            error: (err) => `Error: ${err.message}`
        })
    }

    const onToggleClick = (user: UserProfile) => {
        setSelectedUser(user)
        setConfirmOpen(true)
    }

    const confirmToggleStatus = async () => {
        if (!selectedUser) return

        setIsPending(true)
        const result = await toggleUserStatus(selectedUser.id, selectedUser.is_active)
        setIsPending(false)
        setConfirmOpen(false)

        if (result.success) {
            setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, is_active: !selectedUser.is_active } : u))
            toast.success(`Usuario ${selectedUser.full_name} ${!selectedUser.is_active ? 'activado' : 'desactivado'}`)
        } else {
            toast.error(`Error: ${result.error}`)
        }
    }

    const SortIcon = ({ column }: { column: keyof UserProfile | 'company_name' }) => {
        if (sortConfig?.key !== column) return <MoreHorizontal className="ml-2 h-4 w-4 opacity-30" />
        return sortConfig.direction === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Buscar por nombre, email o empresa..."
                        className="pl-9"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-white overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead className="cursor-pointer hover:text-slate-900" onClick={() => handleSort('full_name')}>
                                <div className="flex items-center">Usuario <SortIcon column="full_name" /></div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:text-slate-900" onClick={() => handleSort('email')}>
                                <div className="flex items-center">Email <SortIcon column="email" /></div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:text-slate-900" onClick={() => handleSort('company_name')}>
                                <div className="flex items-center">Empresa <SortIcon column="company_name" /></div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:text-slate-900" onClick={() => handleSort('role')}>
                                <div className="flex items-center">Rol <SortIcon column="role" /></div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:text-slate-900 text-center" onClick={() => handleSort('is_active')}>
                                <div className="flex items-center justify-center">Estado <SortIcon column="is_active" /></div>
                            </TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-slate-500 italic">
                                    No se encontraron usuarios.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAndSortedUsers.map((u) => (
                                <TableRow key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <UserCircle size={18} />
                                            </div>
                                            <span>{u.full_name || 'Sin nombre'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        <div className="flex items-center gap-1.5 grayscale opacity-70">
                                            <Mail size={14} />
                                            <span>{u.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-slate-600">
                                            <Building2 size={14} className="text-slate-400" />
                                            <span>{u.companies?.name || '-'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {u.role === 'super_admin' ? (
                                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200 shadow-none">Super Admin</Badge>
                                        ) : u.role === 'company_admin' ? (
                                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 shadow-none">Admin Empresa</Badge>
                                        ) : u.role === 'manager' ? (
                                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 shadow-none">Manager</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-slate-500 font-normal">Empleado</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <button
                                            onClick={() => onToggleClick(u)}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 ${u.is_active
                                                ? "bg-green-100 text-green-700 border border-green-200"
                                                : "bg-red-100 text-red-700 border border-red-200"
                                                }`}
                                        >
                                            {u.is_active ? 'Activo' : 'Inactivo'}
                                        </button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs gap-1.5 text-slate-600 hover:text-indigo-600 hover:border-indigo-200"
                                            onClick={() => handleSendResetEmail(u.email)}
                                        >
                                            <Key size={14} />
                                            Reset
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Confirm Dialog */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar cambio de estado?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Estás a punto de <strong>{selectedUser?.is_active ? 'desactivar' : 'activar'}</strong> el acceso para <strong>{selectedUser?.full_name}</strong>.
                            {selectedUser?.is_active ? ' El usuario no podrá entrar al sistema hasta que lo reactives.' : ' El usuario podrá volver a entrar inmediatamente.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                confirmToggleStatus()
                            }}
                            className={selectedUser?.is_active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

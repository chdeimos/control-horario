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
    Loader2,
    UserCheck,
    UserMinus,
    ArrowUpDown,
    Shield,
    Phone
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
    phone: string | null
    companies: {
        name: string
    } | null
}

export function UsersTable({ initialUsers }: { initialUsers: UserProfile[] }) {
    const [filter, setFilter] = useState('')
    const [sortConfig, setSortConfig] = useState<{ key: keyof UserProfile | 'company_name', direction: 'asc' | 'desc' } | null>(null)
    const [users, setUsers] = useState(initialUsers)
    const [isPending, setIsPending] = useState(false)

    // Filters State
    const [roleFilter, setRoleFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [companyFilter, setCompanyFilter] = useState<string>('all')

    // Get unique companies for the filter
    const uniqueCompanies = useMemo(() => {
        const comps = new Set<string>()
        initialUsers.forEach(u => {
            if (u.companies?.name) comps.add(u.companies.name)
        })
        return Array.from(comps).sort()
    }, [initialUsers])

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

        // Text Search (Name, Email, Phone)
        if (filter) {
            const lowerFilter = filter.toLowerCase()
            result = result.filter(u =>
                u.full_name?.toLowerCase().includes(lowerFilter) ||
                u.email?.toLowerCase().includes(lowerFilter) ||
                u.phone?.toLowerCase().includes(lowerFilter)
            )
        }

        // Role Filter
        if (roleFilter !== 'all') {
            result = result.filter(u => u.role === roleFilter)
        }

        // Status Filter
        if (statusFilter !== 'all') {
            const isActive = statusFilter === 'active'
            result = result.filter(u => u.is_active === isActive)
        }

        // Company Filter
        if (companyFilter !== 'all') {
            result = result.filter(u => u.companies?.name === companyFilter)
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
    }, [users, filter, sortConfig, roleFilter, statusFilter, companyFilter])

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

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-lg border border-slate-100 shadow-xl shadow-slate-200/40">
                <div className="relative flex-1 max-w-sm group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#3b60c1] transition-colors" />
                    <Input
                        placeholder="BUSCAR NOMBRE, USUARIO O TELÉFONO..."
                        className="pl-12 h-12 bg-slate-50 border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] focus:bg-white focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all placeholder:text-slate-300"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Role Filter */}
                    <div className="w-40">
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-blue-100/50 focus:bg-white transition-all">
                                <SelectValue placeholder="ROL" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-100 rounded-xl shadow-2xl">
                                <SelectItem value="all" className="text-[10px] font-black uppercase py-3 rounded-lg">TODOS LOS ROLES</SelectItem>
                                <SelectItem value="super_admin" className="text-[10px] font-black uppercase py-3 rounded-lg">SÚPER ADMIN</SelectItem>
                                <SelectItem value="company_admin" className="text-[10px] font-black uppercase py-3 rounded-lg">ADMIN EMPRESA</SelectItem>
                                <SelectItem value="manager" className="text-[10px] font-black uppercase py-3 rounded-lg">GESTOR</SelectItem>
                                <SelectItem value="employee" className="text-[10px] font-black uppercase py-3 rounded-lg">EMPLEADO</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status Filter */}
                    <div className="w-40">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-blue-100/50 focus:bg-white transition-all">
                                <SelectValue placeholder="ESTADO" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-100 rounded-xl shadow-2xl">
                                <SelectItem value="all" className="text-[10px] font-black uppercase py-3 rounded-lg">TODOS LOS ESTADOS</SelectItem>
                                <SelectItem value="active" className="text-[10px] font-black uppercase py-3 rounded-lg text-emerald-600">ACTIVOS</SelectItem>
                                <SelectItem value="inactive" className="text-[10px] font-black uppercase py-3 rounded-lg text-rose-500">DESACTIVADOS</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Company Filter */}
                    <div className="w-56">
                        <Select value={companyFilter} onValueChange={setCompanyFilter}>
                            <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-lg text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-blue-100/50 focus:bg-white transition-all">
                                <SelectValue placeholder="EMPRESA" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-100 rounded-lg shadow-xl shadow-slate-200/40 max-h-80 overflow-y-auto">
                                <SelectItem value="all" className="text-[10px] font-black uppercase py-3 rounded-lg">TODAS LAS EMPRESAS</SelectItem>
                                {uniqueCompanies.map(comp => (
                                    <SelectItem key={comp} value={comp} className="text-[10px] font-black uppercase py-3 rounded-lg">{comp}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

            </div>

            <div className="bg-white rounded-lg border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-b border-slate-100/50 hover:bg-transparent">
                            <TableHead className="cursor-pointer py-6 pl-10" onClick={() => handleSort('full_name')}>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    Nombre <ArrowUpDown size={12} className="opacity-40" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer py-6" onClick={() => handleSort('email')}>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    Usuario <ArrowUpDown size={12} className="opacity-40" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer py-6" onClick={() => handleSort('company_name')}>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    Empresa <ArrowUpDown size={12} className="opacity-40" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer py-6" onClick={() => handleSort('role')}>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    Rol <ArrowUpDown size={12} className="opacity-40" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer py-6 text-center" onClick={() => handleSort('is_active')}>
                                <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    Estado <ArrowUpDown size={12} className="opacity-40" />
                                </div>
                            </TableHead>
                            <TableHead className="text-right py-6 pr-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">opciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedUsers.length === 0 ? (
                            <TableRow className="hover:bg-transparent border-0">
                                <TableCell colSpan={6} className="h-60 text-center bg-slate-50/30">
                                    <div className="flex flex-col items-center justify-center gap-6">
                                        <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-xl text-slate-200">
                                            <Search size={24} />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">Sin Coincidencias en Red</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs mx-auto leading-relaxed">No se han detectado perfiles que coincidan con los parámetros de búsqueda actuales.</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAndSortedUsers.map((u) => (
                                <TableRow key={u.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-all group">
                                    <TableCell className="py-8 pl-10">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center group-hover:bg-[#3b60c1] group-hover:border-[#3b60c1] transition-all duration-500 shadow-sm">
                                                <UserCircle size={18} className="text-[#3b60c1] group-hover:text-white transition-colors" />
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-slate-900 uppercase tracking-tighter leading-none mb-1.5 group-hover:text-[#3b60c1] transition-colors italic">{u.full_name || 'Nodo_Anónimo'}</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50/50 rounded-md border border-blue-100/50">
                                                        <Phone size={10} className="text-[#3b60c1]" />
                                                        <span className="text-[11px] font-black text-[#3b60c1] uppercase tracking-widest tabular-nums font-mono">
                                                            {u.phone || 'P_SIN_CONTACTO'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-8">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">
                                                <Mail size={12} className="opacity-30" />
                                                <span>{u.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-8">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[#3b60c1] group-hover:bg-blue-50 transition-all">
                                                <Building2 size={12} />
                                            </div>
                                            <span className="text-xs font-black text-slate-600 uppercase tracking-wider group-hover:text-slate-900 transition-colors">{u.companies?.name || 'VINCULAR_HOST'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-8">
                                        {u.role === 'super_admin' ? (
                                            <Badge className="rounded-lg bg-slate-950 text-white border-none px-3 py-1.5 text-[9px] font-black uppercase tracking-widest flex w-fit items-center gap-1.5">
                                                <Shield size={10} className="text-blue-400" />
                                                Súper Admin
                                            </Badge>
                                        ) : u.role === 'company_admin' ? (
                                            <Badge className="rounded-lg bg-blue-50 text-[#3b60c1] border border-blue-100 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest w-fit">Admin Empresa</Badge>
                                        ) : u.role === 'manager' ? (
                                            <Badge className="rounded-lg bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest w-fit">Gestor</Badge>
                                        ) : (
                                            <Badge className="rounded-lg bg-transparent border border-slate-100 text-slate-400 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest w-fit">Empleado</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-8 text-center">
                                        <button
                                            onClick={() => onToggleClick(u)}
                                            className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden group/btn ${u.is_active
                                                ? "text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-600 hover:text-white"
                                                : "text-rose-500 bg-rose-50 border border-rose-100 hover:bg-rose-600 hover:text-white"
                                                }`}
                                        >
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                {u.is_active ? <UserCheck size={12} /> : <UserMinus size={12} />}
                                                {u.is_active ? 'Activo' : 'Baja'}
                                            </span>
                                        </button>
                                    </TableCell>
                                    <TableCell className="py-8 text-right pr-10">
                                        <div className="flex items-center justify-end gap-2 transition-all duration-300">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-10 px-4 rounded-xl border border-slate-100 bg-slate-50 text-[9px] font-black uppercase tracking-widest gap-2 hover:bg-[#3b60c1] hover:text-white hover:border-[#3b60c1] transition-all"
                                                onClick={() => handleSendResetEmail(u.email)}
                                            >
                                                <Key size={14} />
                                                Resetear Acceso
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent className="bg-white border-none rounded-3xl shadow-2xl p-0 overflow-hidden max-w-md animate-in zoom-in-95 duration-300">
                    <div className="h-2 bg-[#3b60c1]"></div>
                    <div className="p-10 space-y-8">
                        <AlertDialogHeader className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedUser?.is_active ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                    {selectedUser?.is_active ? <UserMinus size={24} /> : <UserCheck size={24} />}
                                </div>
                                <AlertDialogTitle className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">
                                    Modificar Permisos
                                </AlertDialogTitle>
                            </div>
                            <AlertDialogDescription className="text-slate-500 text-sm font-bold uppercase tracking-wide leading-relaxed">
                                Estas a punto de <span className="text-slate-900 font-extrabold">{selectedUser?.is_active ? 'SUSPENDER' : 'RESTAURAR'}</span> el acceso neural para <span className="text-[#3b60c1] font-black">{selectedUser?.full_name}</span>.
                                <br /><br />
                                Esta acción afectará la autenticación en todos los nodos de la red global.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-3">
                            <AlertDialogCancel disabled={isPending} className="flex-1 bg-slate-50 border-none text-slate-400 hover:text-slate-900 rounded-2xl h-14 uppercase text-[10px] font-black tracking-widest transition-all">
                                ABORTAR OPERACIÓN
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault()
                                    confirmToggleStatus()
                                }}
                                className={`flex-1 rounded-2xl uppercase text-[10px] font-black tracking-widest h-14 transition-all shadow-xl ${selectedUser?.is_active ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200" : "bg-[#3b60c1] hover:bg-[#2d4a94] text-white shadow-blue-200"}`}
                                disabled={isPending}
                            >
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'CONFIRMAR CAMBIO'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Search, X, ChevronLeft, ChevronRight, LayoutGrid, Loader2 } from "lucide-react"
import { toggleEmployeeStatus } from "./actions"
import { toast } from "sonner"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { EditEmployeeDialog } from "./edit-dialog"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

export function EmployeeList({
    employees,
    departments,
    totalCount,
    isAdmin,
    settings
}: {
    employees: any[],
    departments: any[],
    totalCount: number,
    isAdmin: boolean,
    settings?: any
}) {
    const [editingEmployee, setEditingEmployee] = useState<any | null>(null)
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Filter States
    const [empSearch, setEmpSearch] = useState(searchParams.get('search') || '')
    const [deptFilter, setDeptFilter] = useState(searchParams.get('department') || 'all')
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'active')

    const currentPage = parseInt(searchParams.get('page') || '1')
    const pageSize = searchParams.get('pageSize') || '25'
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const handleToggleStatus = async (employee: any) => {
        setLoadingId(employee.id)
        try {
            const res = await toggleEmployeeStatus(employee.id)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success(`${employee.full_name}: ${res.newStatus === 'active' ? 'Activado correctamente' : 'Dando de baja...'}`)
                router.refresh()
            }
        } catch (err) {
            toast.error("Error de comunicación")
        } finally {
            setLoadingId(null)
        }
    }

    // Instant/Debounced Filter Application
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams)
            params.set('page', '1')

            if (empSearch) params.set('search', empSearch)
            else params.delete('search')

            if (deptFilter !== 'all') params.set('department', deptFilter)
            else params.delete('department')

            if (statusFilter) params.set('status', statusFilter)
            else params.delete('status')

            // Only push if params actually changed to avoid infinite loops or unnecessary reloads
            const currentParams = searchParams.toString()
            const newParams = params.toString()
            if (currentParams !== newParams) {
                router.push(`${pathname}?${newParams}`)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [empSearch, deptFilter, statusFilter])

    const clearFilters = () => {
        setEmpSearch('')
        setDeptFilter('all')
        setStatusFilter('active')
        const params = new URLSearchParams()
        params.set('pageSize', pageSize)
        params.set('status', 'active')
        router.push(`${pathname}?${params.toString()}`)
    }


    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams)
        params.set('page', newPage.toString())
        router.push(`${pathname}?${params.toString()}`)
    }

    const handlePageSizeChange = (newValue: string) => {
        const params = new URLSearchParams(searchParams)
        params.set('pageSize', newValue)
        params.set('page', '1')
        router.push(`${pathname}?${params.toString()}`)
    }

    const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalCount / parseInt(pageSize))

    return (
        <div className="space-y-10">
            {/* Filtros Premium */}
            <div className="bg-white p-8 rounded-lg border border-slate-100 shadow-xl shadow-slate-900/5 transition-all">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end">
                    <div className="grid gap-3 w-full">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Buscar Empleado</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Nombre o NIF..."
                                className="pl-10 h-12 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 focus:border-[#3b60c1] transition-all"
                                value={empSearch}
                                onChange={(e) => setEmpSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-3 w-full">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Estado</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border-slate-100 shadow-xl">
                                <SelectItem value="all" className="font-bold">Todos los estados</SelectItem>
                                <SelectItem value="active" className="font-bold">🟢 Activos</SelectItem>
                                <SelectItem value="inactive" className="font-bold">🔴 Inactivos (Bajas)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {isAdmin && (
                        <div className="grid gap-3 w-full">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Departamento</Label>
                            <Select value={deptFilter} onValueChange={setDeptFilter}>
                                <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-slate-100 shadow-xl">
                                    <SelectItem value="all" className="font-bold">Todos los dptos.</SelectItem>
                                    {departments.map((d) => (
                                        <SelectItem key={d.id} value={d.id} className="font-bold">{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="flex gap-3 w-full">
                        {(empSearch || deptFilter !== 'all' || statusFilter !== 'active') && (
                            <Button
                                onClick={clearFilters}
                                className="h-12 flex-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-black uppercase tracking-widest text-[10px] transition-all"
                            >
                                <X className="h-4 w-4 mr-2" /> Limpiar Filtros
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabla de Empleados */}
            <div className="bg-white rounded-lg border border-slate-100 shadow-2xl shadow-slate-900/5 overflow-hidden">
                <Table className="w-full">
                    <TableHeader>
                        <TableRow className="bg-slate-50/80 border-b border-slate-100 hover:bg-slate-50/80">
                            <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Empleado / NIF</TableHead>
                            <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Contacto</TableHead>
                            <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Estado</TableHead>
                            <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Rol / Departamento</TableHead>
                            <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employees.map((employee) => (
                            <TableRow
                                key={employee.id}
                                className={`group border-b border-slate-50 transition-colors hover:bg-blue-50/30 ${employee.status === 'terminated' ? 'bg-slate-50/50 saturate-50' : ''}`}
                            >
                                <TableCell className="py-6 px-6">
                                    <div>
                                        <p className="font-black text-slate-900 tracking-tight leading-none mb-1.5">{employee.full_name}</p>
                                        {employee.nif && (
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{employee.nif}</p>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="py-6 px-6">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-bold text-slate-900 truncate" title={employee.email}>{employee.email}</p>
                                        <p className="text-[10px] font-bold text-slate-400 tabular-nums">{employee.phone || '-'}</p>
                                    </div>
                                </TableCell>
                                <TableCell className="py-6 px-6">
                                    <button
                                        onClick={() => handleToggleStatus(employee)}
                                        disabled={loadingId === employee.id}
                                        className="focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group/status"
                                    >
                                        <Badge
                                            className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-sm cursor-pointer transition-all hover:brightness-110 flex items-center gap-1.5 ${employee.status === 'active' ? 'bg-emerald-500 text-white' :
                                                employee.status === 'terminated' ? 'bg-rose-500 text-white' :
                                                    employee.status === 'medical_leave' ? 'bg-amber-500 text-white' :
                                                        'bg-purple-600 text-white'
                                                }`}
                                        >
                                            {loadingId === employee.id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse group-hover/status:bg-white/60"></div>
                                            )}
                                            {employee.status === 'active' ? 'Activo' :
                                                employee.status === 'terminated' ? 'Baja Def.' :
                                                    employee.status === 'medical_leave' ? 'Baja Médica' :
                                                        employee.status === 'unpaid_leave' ? 'Excedencia' : 'Activo'}
                                        </Badge>
                                    </button>
                                </TableCell>
                                <TableCell className="py-6 px-6">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className={`rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border-2 ${employee.role === 'company_admin' ? 'border-indigo-100 text-indigo-600 bg-indigo-50' :
                                                    (employee.role === 'manager' ? 'border-blue-100 text-blue-600 bg-blue-50' : 'border-slate-100 text-slate-500 bg-slate-50')
                                                    }`}
                                            >
                                                {employee.role === 'company_admin' ? 'ADMIN DE EMPRESA' : (employee.role === 'manager' ? 'GESTOR' : 'EMPLEADO')}
                                            </Badge>
                                        </div>
                                        {employee.departments?.name && (
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-tight">
                                                <LayoutGrid className="h-3 w-3" />
                                                {employee.departments.name}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="py-6 px-6 text-right">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setEditingEmployee(employee)}
                                        className="h-10 w-10 rounded-lg border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Footer / Paginación Premium */}
                <div className="flex flex-col md:flex-row items-center justify-between p-8 gap-6 bg-slate-50/50 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Mostrar</span>
                            <Select value={pageSize} onValueChange={handlePageSizeChange}>
                                <SelectTrigger className="w-[100px] h-12 bg-white border-slate-100 rounded-lg text-xs font-black text-slate-900 focus:ring-[#3b60c1]/20 shadow-sm transition-all flex items-center">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-slate-100 shadow-xl">
                                    <SelectItem value="25" className="font-bold">25</SelectItem>
                                    <SelectItem value="50" className="font-bold">50</SelectItem>
                                    <SelectItem value="100" className="font-bold">100</SelectItem>
                                    <SelectItem value="all" className="font-bold">Todo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="h-4 w-[1px] bg-slate-200 mx-2"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Total: <span className="text-[#3b60c1] text-xs">{totalCount}</span> Registros</span>
                    </div>

                    {pageSize !== 'all' && totalPages > 1 && (
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="h-10 w-10 p-0 rounded-lg border-slate-200 hover:bg-white text-slate-400 hover:text-[#3b60c1] transition-all shadow-sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage <= 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="bg-white px-4 h-10 flex items-center rounded-lg border border-slate-100 shadow-sm">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">Página</span>
                                <span className="text-xs font-black text-slate-900 tabular-nums">{currentPage}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 mx-2">de</span>
                                <span className="text-xs font-black text-slate-900 tabular-nums">{totalPages}</span>
                            </div>
                            <Button
                                variant="outline"
                                className="h-10 w-10 p-0 rounded-lg border-slate-200 hover:bg-white text-slate-400 hover:text-[#3b60c1] transition-all shadow-sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {editingEmployee && (
                <EditEmployeeDialog
                    employee={editingEmployee}
                    departments={departments}
                    settings={settings}
                    open={!!editingEmployee}
                    onOpenChange={(open: boolean) => !open && setEditingEmployee(null)}
                />
            )}
        </div>
    )
}

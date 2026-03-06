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
import { MoreHorizontal, Pencil, Search, X, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react"
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
import { useState } from "react"
import { EditEmployeeDialog } from "./edit-dialog"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

export function EmployeeList({
    employees,
    departments,
    totalCount,
    isAdmin
}: {
    employees: any[],
    departments: any[],
    totalCount: number,
    isAdmin: boolean
}) {
    const [editingEmployee, setEditingEmployee] = useState<any | null>(null)
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Filter States
    const [empSearch, setEmpSearch] = useState(searchParams.get('search') || '')
    const [deptFilter, setDeptFilter] = useState(searchParams.get('department') || 'all')

    const currentPage = parseInt(searchParams.get('page') || '1')
    const pageSize = searchParams.get('pageSize') || '25'

    const applyFilters = () => {
        const params = new URLSearchParams(searchParams)
        params.set('page', '1')

        if (empSearch) params.set('search', empSearch)
        else params.delete('search')

        if (deptFilter && deptFilter !== 'all') params.set('department', deptFilter)
        else params.delete('department')

        router.push(`${pathname}?${params.toString()}`)
    }

    const clearFilters = () => {
        setEmpSearch('')
        setDeptFilter('all')
        const params = new URLSearchParams()
        params.set('pageSize', pageSize)
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
        <div className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-4 items-end bg-white p-4 rounded-lg border shadow-sm">
                <div className="grid gap-1.5 flex-1 w-full">
                    <Label>Buscar Empleado</Label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Nombre completo o NIF..."
                            className="pl-9"
                            value={empSearch}
                            onChange={(e) => setEmpSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
                    </div>
                </div>
                {isAdmin && (
                    <div className="grid gap-1.5 w-full md:w-52">
                        <Label>Departamento</Label>
                        <Select value={deptFilter} onValueChange={setDeptFilter}>
                            <SelectTrigger className="text-black">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {departments.map((d) => (
                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div className="flex gap-2 w-full md:w-auto">
                    <Button onClick={applyFilters} className="flex-1 md:flex-none">Filtrar</Button>
                    {(empSearch || deptFilter !== 'all') && (
                        <Button variant="outline" size="icon" onClick={clearFilters}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50">
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Departamento</TableHead>
                            <TableHead>Vacaciones</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employees.map((employee) => (
                            <TableRow key={employee.id} className={employee.status === 'terminated' ? 'bg-red-50 opacity-70' : ''}>
                                <TableCell className="font-medium">
                                    {employee.full_name}
                                    {employee.nif && <div className="text-xs text-muted-foreground font-normal">{employee.nif}</div>}
                                </TableCell>
                                <TableCell>{employee.email}</TableCell>
                                <TableCell>
                                    <Badge
                                        className={
                                            employee.status === 'active' ? 'bg-green-600 hover:bg-green-700' :
                                                employee.status === 'terminated' ? 'bg-red-600 hover:bg-red-700' :
                                                    employee.status === 'medical_leave' ? 'bg-orange-500 hover:bg-orange-600' :
                                                        'bg-purple-600 hover:bg-purple-700'
                                        }
                                    >
                                        {employee.status === 'active' ? 'Activo' :
                                            employee.status === 'terminated' ? 'Baja Def.' :
                                                employee.status === 'medical_leave' ? 'Baja Médica' :
                                                    employee.status === 'unpaid_leave' ? 'Excedencia' : 'Activo'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={employee.role === 'company_admin' ? 'default' : (employee.role === 'manager' ? 'secondary' : 'outline')}>
                                        {employee.role === 'company_admin' ? 'Admin' : (employee.role === 'manager' ? 'Manager' : 'Empleado')}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {employee.departments?.name ? (
                                        <div className="flex items-center gap-1.5 text-xs font-medium">
                                            <LayoutGrid className="h-3 w-3 text-muted-foreground" />
                                            {employee.departments.name}
                                        </div>
                                    ) : '-'}
                                </TableCell>
                                <TableCell>{employee.total_vacation_days} días</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => setEditingEmployee(employee)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {employees.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">
                                    No se han encontrado empleados con los filtros aplicados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Footer / Paginación */}
                <div className="flex flex-col md:flex-row items-center justify-between p-4 gap-4 bg-gray-50/50 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Mostrar</span>
                        <Select value={pageSize} onValueChange={handlePageSizeChange}>
                            <SelectTrigger className="w-[80px] h-8 text-black">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                                <SelectItem value="all">Todo</SelectItem>
                            </SelectContent>
                        </Select>
                        <span>registros por página</span>
                        <span className="ml-4 font-medium text-foreground">Total: {totalCount}</span>
                    </div>

                    {pageSize !== 'all' && totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage <= 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-sm font-medium">
                                Página {currentPage} de {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
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
                    open={!!editingEmployee}
                    onOpenChange={(open: boolean) => !open && setEditingEmployee(null)}
                />
            )}
        </div>
    )
}

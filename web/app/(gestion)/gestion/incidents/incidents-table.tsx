'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Search, X, ChevronLeft, ChevronRight, Clock, User, LayoutGrid, ShieldAlert, Settings } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface IncidentsTableProps {
    initialIncidents: any[]
    totalCount: number
    departments?: { id: string, name: string }[]
}

export function IncidentsTable({ initialIncidents, totalCount, departments = [] }: IncidentsTableProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Filter States
    const [empSearch, setEmpSearch] = useState(searchParams.get('search') || '')
    const [fromDate, setFromDate] = useState(searchParams.get('from') || '')
    const [toDate, setToDate] = useState(searchParams.get('to') || '')
    const [deptFilter, setDeptFilter] = useState(searchParams.get('department') || 'all')

    const currentPage = parseInt(searchParams.get('page') || '1')
    const pageSize = searchParams.get('pageSize') || '25'

    const applyFilters = () => {
        const params = new URLSearchParams(searchParams)
        params.set('page', '1')

        if (empSearch) params.set('search', empSearch)
        else params.delete('search')

        if (fromDate) params.set('from', fromDate)
        else params.delete('from')

        if (toDate) params.set('to', toDate)
        else params.delete('to')

        if (deptFilter && deptFilter !== 'all') params.set('department', deptFilter)
        else params.delete('department')

        router.push(`${pathname}?${params.toString()}`)
    }

    const clearFilters = () => {
        setEmpSearch('')
        setFromDate('')
        setToDate('')
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
                            placeholder="Nombre completo..."
                            className="pl-9"
                            value={empSearch}
                            onChange={(e) => setEmpSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
                    </div>
                </div>

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

                <div className="grid gap-1.5 w-full md:w-40">
                    <Label>Desde (Cambio)</Label>
                    <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div className="grid gap-1.5 w-full md:w-40">
                    <Label>Hasta (Cambio)</Label>
                    <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button onClick={applyFilters} className="flex-1 md:flex-none">Buscar</Button>
                    {(empSearch || fromDate || toDate || deptFilter !== 'all') && (
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
                            <TableHead>Empleado</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Fecha Registro</TableHead>
                            <TableHead>Horario / Estado</TableHead>
                            <TableHead>Motivo / Observaciones</TableHead>
                            <TableHead className="text-right">Fecha Auditoría</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialIncidents.map((inc: any) => (
                            <TableRow key={inc.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 text-blue-600">
                                            <User className="h-3.5 w-3.5" />
                                            {inc.profiles.full_name}
                                        </div>
                                        {inc.profiles?.departments?.name && (
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider pl-5">
                                                <LayoutGrid className="h-2.5 w-2.5" />
                                                {inc.profiles.departments.name}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {inc.is_manual_correction ? (
                                        <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-200">
                                            <Settings className="h-2.5 w-2.5 mr-1" /> MANUAL
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">
                                            <ShieldAlert className="h-2.5 w-2.5 mr-1" /> SISTEMA
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {format(new Date(inc.clock_in), 'dd MMM yyyy', { locale: es })}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-xs font-medium">
                                            <Clock className="h-3 w-3 text-gray-400" />
                                            {format(new Date(inc.clock_in), 'HH:mm')} - {inc.clock_out ? format(new Date(inc.clock_out), 'HH:mm') : '--:--'}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-md">
                                    <p className="text-sm text-gray-600 italic">
                                        "{inc.correction_reason || inc.incident_reason || 'Sin motivo especificado'}"
                                    </p>
                                </TableCell>
                                <TableCell className="text-right text-xs text-muted-foreground">
                                    {format(new Date(inc.updated_at), 'dd/MM/yy HH:mm')}
                                </TableCell>
                            </TableRow>
                        ))}
                        {initialIncidents.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                                    No se han encontrado incidencias con los filtros aplicados.
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
        </div>
    )
}

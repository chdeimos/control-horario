'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Search, X, ChevronLeft, ChevronRight, Clock, User, LayoutGrid, Filter } from 'lucide-react'
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, ArrowRight, History as HistoryIcon, Loader2 } from "lucide-react"
import { updateTimeEntry } from "@/app/(dashboard)/dashboard/actions"
import { useTransition } from "react"

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
    const [auditedFilter, setAuditedFilter] = useState(searchParams.get('audited') || 'no')

    // Edit State
    const [editingEntry, setEditingEntry] = useState<any>(null)
    const [reason, setReason] = useState("")
    const [start, setStart] = useState("")
    const [end, setEnd] = useState("")
    const [isPending, startTransition] = useTransition()

    const currentPage = parseInt(searchParams.get('page') || '1')
    const pageSize = searchParams.get('pageSize') || '25'

    // Filter Application with Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams)
            params.set('page', '1')

            if (empSearch) params.set('search', empSearch)
            else params.delete('search')

            if (fromDate) params.set('from', fromDate)
            else params.delete('from')

            if (toDate) params.set('to', toDate)
            else params.delete('to')

            if (deptFilter !== 'all') params.set('department', deptFilter)
            else params.delete('department')

            if (auditedFilter) params.set('audited', auditedFilter)
            else params.delete('audited')

            const currentParams = searchParams.toString()
            const newParams = params.toString()
            if (currentParams !== newParams) {
                router.push(`${pathname}?${newParams}`)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [empSearch, fromDate, toDate, deptFilter, auditedFilter])

    const clearFilters = () => {
        setEmpSearch('')
        setFromDate('')
        setToDate('')
        setDeptFilter('all')
        setAuditedFilter('all')
        const params = new URLSearchParams()
        params.set('pageSize', pageSize)
        router.push(`${pathname}?${params.toString()}`)
    }

    // Edit and Audit Helpers
    function handleEditClick(entry: any) {
        setEditingEntry(entry)
        setReason(entry.correction_reason || "")

        const formatDateForInput = (dateStr: string) => {
            const date = new Date(dateStr)
            const offset = date.getTimezoneOffset() * 60000
            const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16)
            return localISOTime
        }

        setStart(entry.clock_in ? formatDateForInput(entry.clock_in) : "")
        setEnd(entry.clock_out ? formatDateForInput(entry.clock_out) : "")
    }

    async function handleSave() {
        startTransition(async () => {
            const result = await updateTimeEntry(editingEntry.id, {
                clockIn: new Date(start).toISOString(),
                clockOut: end ? new Date(end).toISOString() : null,
                reason
            })

            if (result?.error) {
                alert(result.error)
            } else {
                setEditingEntry(null)
                router.refresh()
            }
        })
    }

    function calculateDuration(start: string, end: string | null) {
        if (!end) return '--:--'
        const diff = new Date(end).getTime() - new Date(start).getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        return `${hours}h ${minutes}m`
    }

    function getScheduleDescription(entry: any) {
        if (!entry || !entry.profiles) return 'Sin horario definido'

        const profile = entry.profiles
        if (profile.schedule_type === 'flexible') {
            return 'Horario Libre / Flexible'
        }

        const date = new Date(entry.clock_in)
        let dayOfWeek = date.getDay()
        if (dayOfWeek === 0) dayOfWeek = 7

        const schedule = profile.work_schedules?.find((s: any) => s.day_of_week === dayOfWeek && s.is_active)

        if (!schedule) return 'Sin horario fijado para este día'

        const formatTime = (time: string) => time.slice(0, 5)

        let desc = `${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}`
        if (schedule.start_time_2 && schedule.end_time_2) {
            desc += ` y ${formatTime(schedule.start_time_2)} - ${formatTime(schedule.end_time_2)}`
        }

        return desc
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
            <div className="bg-white rounded-lg border border-slate-100 shadow-xl shadow-slate-900/5 transition-all overflow-hidden mb-12">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="h-6 w-1 bg-blue-500 rounded-full"></div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Panel de Filtros Avanzado</h3>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-x-6 gap-y-8 items-end">
                    <div className="grid gap-3 w-full lg:col-span-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Buscar Empleado</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Nombre del empleado…"
                                className="pl-10 h-12 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 focus:border-[#3b60c1] transition-all shadow-sm"
                                value={empSearch}
                                onChange={(e) => setEmpSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-3 w-full lg:col-span-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Departamento</Label>
                        <Select value={deptFilter} onValueChange={setDeptFilter}>
                            <SelectTrigger className="h-12 px-4 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 shadow-sm text-slate-900 transition-all overflow-hidden flex items-center">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border-slate-100 shadow-xl">
                                <SelectItem value="all" className="font-bold text-slate-500">Todos los Dept.</SelectItem>
                                {departments.map((d) => (
                                    <SelectItem key={d.id} value={d.id} className="font-bold">{d.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-3 w-full lg:col-span-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Estado Auditoría</Label>
                        <Select value={auditedFilter} onValueChange={setAuditedFilter}>
                            <SelectTrigger className="h-12 px-4 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 shadow-sm transition-all overflow-hidden flex items-center">
                                <SelectValue placeholder="Pendientes" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border-slate-100 shadow-xl">
                                <SelectItem value="all" className="font-bold text-slate-500">Todos los Estados</SelectItem>
                                <SelectItem value="yes" className="font-bold text-emerald-600">Auditados</SelectItem>
                                <SelectItem value="no" className="font-bold text-amber-600 italic">! Pendientes</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-4 grid-cols-2 lg:col-span-4">
                        <div className="grid gap-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Fecha Desde</Label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="h-12 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 transition-all pr-8 shadow-sm flex items-center"
                                />
                            </div>
                        </div>
                        <div className="grid gap-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Fecha Hasta</Label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="h-12 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 transition-all pr-8 shadow-sm flex items-center"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        {(empSearch || fromDate || toDate || deptFilter !== 'all' || auditedFilter !== 'no') ? (
                            <Button
                                onClick={clearFilters}
                                variant="outline"
                                className="h-12 w-full rounded-lg border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 active:scale-[0.98] transition-all group"
                                title="Limpiar Filtros"
                            >
                                <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                            </Button>
                        ) : (
                            <div className="h-12 w-full flex items-center justify-center text-slate-200">
                                <Filter className="h-5 w-5 opacity-20" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-100 shadow-2xl shadow-slate-900/5 overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="h-6 w-1 bg-amber-500 rounded-full"></div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Historial de Incidencias</h3>
                    </div>
                </div>
                <Table className="w-full table-fixed">
                    <TableHeader>
                        <TableRow className="bg-slate-50/80 border-b border-slate-100 hover:bg-slate-50/80">
                            <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 w-[200px]">Empleado</TableHead>
                            <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 w-[120px]">Fecha</TableHead>
                            <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 w-[150px]">Horario</TableHead>
                            <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Motivo de la Modificación</TableHead>
                            <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right w-[160px]">Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialIncidents.map((inc: any) => (
                            <TableRow key={inc.id} className="group border-b border-slate-50 transition-colors hover:bg-blue-50/30">
                                <TableCell className="py-6 px-6 font-medium">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2 text-sm font-black text-slate-900 tracking-tight">
                                            {inc.profiles.full_name}
                                        </div>
                                        {inc.profiles?.departments?.name && (
                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 transition-colors uppercase tracking-tight">
                                                <LayoutGrid className="h-2.5 w-2.5" strokeWidth={3} />
                                                {inc.profiles.departments.name}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="py-6 px-6">
                                    <span className="text-sm font-bold text-slate-700 tabular-nums">{format(new Date(inc.clock_in), 'dd/MM/yyyy')}</span>
                                </TableCell>
                                <TableCell className="py-6 px-6">
                                    <div className="flex items-center gap-2 bg-slate-50 w-fit px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm shrink-0">
                                        <Clock className="h-3 w-3 text-[#3b60c1]" strokeWidth={3} />
                                        <span className="text-[11px] font-black text-slate-800 tabular-nums">
                                            {format(new Date(inc.clock_in), 'HH:mm')}—{inc.clock_out ? format(new Date(inc.clock_out), 'HH:mm') : '??'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-6 px-6">
                                    <div className="flex flex-col gap-2">
                                        <div className="p-3 bg-amber-50/30 rounded-lg border border-amber-100/50">
                                            <p className="text-[12px] font-medium text-slate-600 leading-snug line-clamp-2 italic">
                                                "{inc.correction_reason || inc.incident_reason || 'Sin motivo'}"
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {inc.is_manual_correction ? (
                                                <span className="text-[8px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">Manual</span>
                                            ) : (
                                                <span className="text-[8px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 italic">🤖 Sistema</span>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="py-6 px-6 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] font-black text-slate-900 tracking-tight uppercase tabular-nums leading-none">
                                                {format(new Date(inc.updated_at), 'dd/MM/yy')}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400 tabular-nums mt-0.5">
                                                {format(new Date(inc.updated_at), 'HH:mm')}
                                            </span>
                                        </div>
                                        {inc.is_audited ? (
                                            <div className="bg-emerald-50 text-emerald-700 text-[8px] font-black px-1.5 py-1 rounded border border-emerald-100 uppercase tracking-tighter">
                                                OK
                                            </div>
                                        ) : (
                                            <div className="bg-amber-50 text-amber-700 text-[8px] font-black px-1.5 py-1 rounded border border-amber-100 uppercase tracking-tighter shadow-sm animate-pulse">
                                                PTE
                                            </div>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditClick(inc)}
                                            className="h-8 w-8 rounded-lg p-0 border-slate-200 hover:bg-[#3b60c1]/5 hover:text-[#3b60c1] hover:border-[#3b60c1]/20 transition-all active:scale-95"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </div>
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

            <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
                <DialogContent className="rounded-lg sm:max-w-[440px] p-0 overflow-hidden border-none shadow-2xl">
                    {editingEntry && (
                        <div className="p-6 space-y-5 bg-white font-sans">
                            <div>
                                <DialogTitle className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                                    <HistoryIcon size={18} className="text-[#3b60c1]" />
                                    Auditar Incidencia
                                </DialogTitle>
                                <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                                    Revisa y confirma los horarios. Al guardar se marcará como auditado.
                                </DialogDescription>
                            </div>

                            {/* Schedule Info Section */}
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex items-center gap-4">
                                <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
                                    <LayoutGrid size={18} className="text-[#3b60c1]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Horario Asignado</p>
                                    <p className="text-sm font-black text-slate-900 tracking-tight leading-none">
                                        {getScheduleDescription(editingEntry)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#3b60c1] flex items-center gap-2 leading-none">
                                        <Clock size={12} /> Hora de Entrada
                                    </Label>
                                    <Input
                                        type="datetime-local"
                                        className="h-14 rounded-lg font-black text-base text-slate-900 border-slate-200 bg-slate-50 focus:bg-white transition-all shadow-inner tabular-nums p-4"
                                        value={start}
                                        onChange={(e) => setStart(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 leading-none">
                                        <Clock size={12} /> Hora de Salida
                                    </Label>
                                    <Input
                                        type="datetime-local"
                                        className="h-14 rounded-lg font-black text-base text-slate-900 border-slate-200 bg-slate-50 focus:bg-white transition-all shadow-inner tabular-nums p-4"
                                        value={end}
                                        onChange={(e) => setEnd(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Compact Live Duration Preview */}
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex items-center gap-4">
                                <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
                                    <Clock size={18} className="text-[#3b60c1]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Duración Resultante</p>
                                    <p className="text-xl font-black text-slate-900 tabular-nums leading-none">
                                        {calculateDuration(start, end)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 leading-none">
                                    <Pencil size={12} /> Motivo / Comentario Auditoría
                                </Label>
                                <Textarea
                                    className="rounded-lg border-slate-200 min-h-[90px] font-medium p-4 bg-slate-50 focus:bg-white transition-all text-sm leading-snug"
                                    placeholder="Indique cualquier observación..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </div>

                            <DialogFooter className="pt-2 px-6 pb-6">
                                <Button
                                    onClick={handleSave}
                                    disabled={!reason.trim() || isPending}
                                    className="w-full h-12 bg-[#3b60c1] hover:bg-[#2d4a94] text-white font-bold rounded-lg shadow-xl shadow-blue-900/10 flex gap-3 active:scale-95 transition-all text-[11px] uppercase tracking-widest hover:-translate-y-0.5 border-none"
                                >
                                    {isPending ? (
                                        <Loader2 className="animate-spin h-5 w-5" />
                                    ) : (
                                        <>
                                            Confirmar Auditoría
                                            <ArrowRight size={18} className="stroke-[3px]" />
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

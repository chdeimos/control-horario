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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useState, useTransition, useEffect } from "react"
import { Pencil, Search, X, ChevronLeft, ChevronRight, LayoutGrid, AlertTriangle, Filter, MapPin, Clock, Calendar, ArrowRight, Laptop, Briefcase, History as HistoryIcon, Loader2 } from "lucide-react"
import { updateTimeEntry } from "@/app/(dashboard)/dashboard/actions"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import Link from "next/link"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export function TimeEntriesTable({
    initialEntries,
    isAdmin,
    totalCount,
    departments = [],
    workSchedules = []
}: {
    initialEntries: any[],
    isAdmin: boolean,
    totalCount: number,
    departments?: { id: string, name: string }[],
    workSchedules?: any[]
}) {
    const [editingEntry, setEditingEntry] = useState<any>(null)
    const [reason, setReason] = useState("")
    const [start, setStart] = useState("")
    const [end, setEnd] = useState("")
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number, lng: number } | null>(null)
    const [showFilters, setShowFilters] = useState(false)

    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    // Filter States
    const [empSearch, setEmpSearch] = useState(searchParams.get('search') || '')
    const today = format(new Date(), 'yyyy-MM-dd')
    const [fromDate, setFromDate] = useState(searchParams.get('from') || today)
    const [toDate, setToDate] = useState(searchParams.get('to') || today)
    const [deptFilter, setDeptFilter] = useState(searchParams.get('department') || 'all')

    // Safe date parsing helper to avoid timezone shifts for YYYY-MM-DD
    const parseDate = (dateStr: string) => {
        if (!dateStr || dateStr === "") return new Date()
        const [year, month, day] = dateStr.split('-').map(Number)
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            return new Date(year, month - 1, day)
        }
        return new Date(dateStr)
    }

    function calculateDuration(start: string, end: string | null) {
        if (!end) return 'En curso'
        const diff = new Date(end).getTime() - new Date(start).getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        return `${hours}h ${minutes}m`
    }

    const formatEntryType = (type: string) => {
        if (!type) return 'Presencial'
        const lower = type.toLowerCase()
        if (lower === 'remote' || lower === 'remote_work') return 'Remoto'
        if (lower === 'work' || lower === 'onsite') return 'Presencial'
        if (lower === 'break') return 'Descanso'
        if (lower === 'training') return 'Formación'
        if (lower === 'medical') return 'Médico'
        return type.charAt(0).toUpperCase() + type.slice(1)
    }

    const getEntryTypeStyles = (type: string) => {
        const lower = (type || 'work').toLowerCase()
        if (lower === 'work' || lower === 'onsite') return 'bg-[#f0f9ff] text-[#0369a1] border-[#e0f2fe]'
        if (lower === 'break') return 'bg-[#fffbeb] text-[#d97706] border-[#fef3c7]'
        if (lower === 'remote' || lower === 'remote_work') return 'bg-[#eff6ff] text-[#2563eb] border-[#dbeafe]'
        if (lower === 'training') return 'bg-[#f5f3ff] text-[#7c3aed] border-[#ede9fe]'
        if (lower === 'medical') return 'bg-[#fff1f2] text-[#e11d48] border-[#ffe4e6]'
        return 'bg-[#f8fafc] text-[#64748b] border-[#f1f5f9]'
    }

    const formatOrigin = (origin: string) => {
        if (!origin) return '-'
        const lower = origin.toLowerCase()
        if (lower === 'web') return 'Web'
        if (lower === 'mobile' || lower === 'mobile_app') return 'Móvil'
        if (lower === 'ios') return 'iOS'
        if (lower === 'android') return 'Android'
        if (lower === 'work') return 'Presencial'
        if (lower === 'manual_correction') return 'CORREGIDA'
        return origin.charAt(0).toUpperCase() + origin.slice(1)
    }

    const getOriginStyles = (origin: string) => {
        const lower = (origin || '').toLowerCase()
        const isMobile = ['mobile', 'mobile_app', 'ios', 'android'].includes(lower)
        const isPresencial = lower === 'work'
        if (isMobile || isPresencial) return 'bg-[#ecfdf5] text-[#059669] border-[#d1fae5]'
        return 'text-slate-500 border-transparent bg-transparent'
    }

    const applyFilters = () => {
        const params = new URLSearchParams(searchParams)
        params.delete('page')

        if (empSearch) params.set('search', empSearch)
        else params.delete('search')

        if (fromDate) params.set('from', fromDate)
        else params.delete('from')

        if (toDate) params.set('to', toDate)
        else params.delete('to')

        if (deptFilter && deptFilter !== 'all') params.set('department', deptFilter)
        else params.delete('department')

        router.push(`${pathname}?${params.toString()}`)
        setShowFilters(false)
    }

    // Auto-search for date changes
    const handleDateChange = (date: string) => {
        setFromDate(date)
        setToDate(date)

        const params = new URLSearchParams(searchParams)
        params.delete('page')
        if (date) {
            params.set('from', date)
            params.set('to', date)
        } else {
            params.delete('from')
            params.delete('to')
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    const clearFilters = () => {
        setEmpSearch('')
        setFromDate('')
        setToDate('')
        setDeptFilter('all')
        const params = new URLSearchParams()
        router.push(`${pathname}?${params.toString()}`)
    }

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

    return (
        <TooltipProvider>
            <div className="space-y-6">
                {/* CONSULTA DIARIA CARD - Total Fidelity */}
                <div className="bg-white p-10 rounded-lg border border-slate-100 shadow-sm space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block">CONSULTA DIARIA</Label>
                        <div className="flex items-center gap-3">
                            <h3 className="text-3xl font-bold text-slate-800 tracking-tight">
                                {format(parseDate(fromDate), 'eeee, d \'de\' MMMM \'de\' yyyy', { locale: es })}
                            </h3>
                            {fromDate === today && (
                                <Badge className="bg-[#e2e8f0] text-[#64748b] text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shadow-none border-none">HOY</Badge>
                            )}
                        </div>
                    </div>

                    <div className="max-w-[280px]">
                        <div className="relative group">
                            <Input
                                type="date"
                                value={fromDate}
                                className="h-14 pl-5 rounded-md font-medium text-slate-600 border-slate-200 bg-white transition-all w-full appearance-none cursor-pointer pr-12 focus:ring-0 focus:border-slate-300"
                                onChange={(e) => handleDateChange(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Filtros Avanzados (Solo Admin - Colapsable) */}
                {isAdmin && (
                    <div className={`${showFilters ? 'block' : 'hidden'} bg-white p-6 rounded-lg border border-slate-100 shadow-lg shadow-slate-200/50 animate-in fade-in slide-in-from-top-4 duration-300`}>
                        <div className="grid gap-6 md:grid-cols-12 md:items-end">
                            <div className="space-y-2 md:col-span-4">
                                <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Empleado</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                    <Input
                                        placeholder="Nombre del empleado..."
                                        className="h-12 pl-10 rounded-lg border-slate-200 font-bold bg-slate-50 focus:bg-white text-sm"
                                        value={empSearch}
                                        onChange={(e) => setEmpSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-3">
                                <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Departamento</Label>
                                <Select value={deptFilter} onValueChange={setDeptFilter}>
                                    <SelectTrigger className="h-12 rounded-lg font-bold border-slate-200 bg-slate-50 focus:bg-white text-slate-700 text-sm">
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg">
                                        <SelectItem value="all">Todos los Departamentos</SelectItem>
                                        {departments.map((d) => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4 md:col-span-5">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Desde</Label>
                                    <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-12 rounded-lg font-bold border-slate-200 bg-slate-50 text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Hasta</Label>
                                    <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-12 rounded-lg font-bold border-slate-200 bg-slate-50 text-sm" />
                                </div>
                            </div>
                            <div className="flex gap-2 col-span-12 justify-end">
                                <Button onClick={applyFilters} className="h-12 px-8 bg-[#3b60c1] hover:bg-[#2d4a94] text-white font-bold rounded-lg uppercase tracking-widest text-xs shadow-none active:scale-95 transition-all">Aplicar Filtros</Button>
                                <Button variant="outline" onClick={clearFilters} className="h-12 px-4 rounded-lg border-slate-200 text-slate-400"><X size={16} /></Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Historial Content - Dual View System */}
                <div className="space-y-4">
                    {/* MOBILE VIEW - Card List (Redesigned with inline metadata) */}
                    <div className="md:hidden space-y-4">
                        {initialEntries?.map((entry) => (
                            <div
                                key={entry.id}
                                className={`bg-white rounded-lg border border-slate-100 shadow-lg shadow-slate-200/20 overflow-hidden group active:scale-[0.98] transition-all relative`}
                            >
                                <div className="p-5">
                                    {/* Top Row: Date & Edit Button */}
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-[#3b60c1]" />
                                            <p className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">
                                                {format(parseDate(entry.clock_in.split('T')[0]), 'PPP', { locale: es })}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditClick(entry)}
                                            className="h-8 w-8 text-slate-300 hover:text-[#3b60c1]"
                                        >
                                            <Pencil size={14} />
                                        </Button>
                                    </div>

                                    {/* Metadata Strip: Duration | Origin | Type | Incident */}
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4 text-[9px] font-bold uppercase tracking-[0.1em]">
                                        <div className="flex items-center gap-1 text-slate-900">
                                            <Clock size={10} className="text-slate-400" />
                                            {calculateDuration(entry.clock_in, entry.clock_out)}
                                        </div>
                                        {entry.profiles?.schedule_type === 'flexible' && (
                                            <>
                                                <div className="w-[1px] h-2.5 bg-slate-200"></div>
                                                {(() => {
                                                    const dayDate = new Date(entry.clock_in)
                                                    const dow = dayDate.getDay() === 0 ? 7 : dayDate.getDay()
                                                    const sched = workSchedules?.find(s => s.day_of_week === dow)
                                                    const target = sched?.target_total_hours ?? 0

                                                    if (target > 0) {
                                                        const diff = entry.clock_out
                                                            ? (new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()) / (1000 * 60 * 60)
                                                            : 0
                                                        const isCompleted = diff >= target

                                                        return (
                                                            <div className={`flex items-center gap-1 ${isCompleted ? 'text-[#3b60c1]' : 'text-amber-600'}`}>
                                                                {isCompleted ? 'OBJETIVO OK' : `${diff.toFixed(1)}/${target}H`}
                                                            </div>
                                                        )
                                                    }
                                                    return null
                                                })()}
                                            </>
                                        )}
                                        <div className="w-[1px] h-2.5 bg-slate-200"></div>
                                        <div className="flex items-center gap-1">
                                            <Laptop size={10} className={formatOrigin(entry.origin) === 'Móvil' ? 'text-emerald-500/50' : 'text-slate-300'} />
                                            <span className={`${getOriginStyles(entry.origin)} px-1.5 py-0 rounded-[4px] border text-[9px] font-bold tracking-tight inline-flex items-center`}>
                                                {formatOrigin(entry.origin)}
                                            </span>
                                        </div>
                                        <div className="w-[1px] h-2.5 bg-slate-200"></div>
                                        <div className="flex items-center gap-1">
                                            <Briefcase size={10} className="text-slate-300" />
                                            <span className={`${getEntryTypeStyles(entry.entry_type)} px-1.5 py-0 rounded-[4px] border text-[9px] font-bold tracking-tight inline-flex items-center`}>
                                                {formatEntryType(entry.entry_type)}
                                            </span>
                                        </div>
                                        {entry.is_incident && (
                                            <>
                                                <div className="w-[1px] h-2.5 bg-slate-200"></div>
                                                <div className="text-rose-600 font-bold">
                                                    Incidencia
                                                </div>
                                            </>
                                        )}
                                        {(() => {
                                            const isHardware = entry.origin?.toLowerCase().includes('hardware') || entry.origin?.toLowerCase().includes('tablet') || entry.origin?.toLowerCase().includes('terminal');
                                            const hasCoords = !!(entry.gps_lat && entry.gps_long);
                                            return (
                                                <>
                                                    <div className="w-[1px] h-2.5 bg-slate-200"></div>
                                                    <div className={`flex items-center gap-1 ${isHardware ? 'opacity-20' : hasCoords ? 'text-[#3b60c1]' : 'text-slate-300'}`}
                                                        onClick={(e) => {
                                                            if (!isHardware && hasCoords) {
                                                                e.stopPropagation();
                                                                setSelectedCoords({ lat: entry.gps_lat, lng: entry.gps_long });
                                                            }
                                                        }}
                                                    >
                                                        <MapPin size={10} />
                                                        <span>{isHardware ? 'TERMINAL' : hasCoords ? 'MAPA' : 'NO GPS'}</span>
                                                    </div>
                                                </>
                                            )
                                        })()}
                                    </div>

                                    {/* Main Time Grid */}
                                    <div className="grid grid-cols-2 gap-3 bg-slate-50/80 rounded-lg p-3 border border-slate-100">
                                        <div>
                                            <p className="text-[8px] font-bold text-[#3b60c1] uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                Entrada
                                            </p>
                                            <p className="text-base font-bold text-slate-900 tabular-nums">
                                                {format(new Date(entry.clock_in), 'HH:mm:ss')}
                                            </p>
                                        </div>
                                        <div className="border-l border-slate-200 pl-3">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                Salida
                                            </p>
                                            {entry.clock_out ? (
                                                <p className="text-base font-bold text-slate-900 tabular-nums">
                                                    {format(new Date(entry.clock_out), 'HH:mm:ss')}
                                                </p>
                                            ) : (
                                                <span className="inline-block bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-lg animate-pulse uppercase">En curso</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Multi-line note / incident reason if exists */}
                                    {(entry.correction_reason || entry.incident_reason) && (
                                        <div className={`mt-4 p-3 rounded-lg border ${entry.is_manual_correction ? 'bg-blue-50 border-blue-100' : 'bg-rose-50 border-rose-100'}`}>
                                            <p className={`text-[11px] font-medium italic leading-snug ${entry.is_manual_correction ? 'text-blue-700' : 'text-rose-600'}`}>
                                                "{entry.correction_reason || entry.incident_reason}"
                                            </p>
                                            {entry.is_manual_correction && (
                                                <div className="flex items-center gap-1 mt-1.5">
                                                    <Pencil size={8} className="text-blue-400" />
                                                    <span className="text-[8px] font-bold uppercase tracking-widest text-blue-400">Nota de justificación</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* DESKTOP VIEW - PandoraSoft Style Table */}
                    <div className="hidden md:block bg-white rounded-lg border border-slate-100 shadow-sm overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-white">
                                <TableRow className="border-b border-slate-100">
                                    <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-900 py-8 px-8">FECHA</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-900 py-8">ENTRADA</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-900 py-8">SALIDA</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-900 py-8">DURACIÓN</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-900 py-8">TIPO / ORIGEN</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-900 py-8">NOTA / JUSTIFICACIÓN</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-900 py-8 text-center">UBICACIÓN</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-900 py-8 text-center">ACCIONES</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialEntries?.map((entry) => (
                                    <TableRow
                                        key={entry.id}
                                        className="border-b border-slate-100/60 hover:bg-slate-50/30 transition-colors"
                                    >
                                        <TableCell className="px-8 py-6 font-bold text-slate-700">
                                            {format(parseDate(entry.clock_in.split('T')[0]), 'dd/MM/yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="w-32 h-12 border border-slate-200 rounded flex items-center justify-center text-[15px] font-medium text-slate-600 bg-white">
                                                {format(new Date(entry.clock_in), 'HH:mm:ss')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {entry.clock_out ? (
                                                <div className="w-32 h-12 border border-slate-200 rounded flex items-center justify-center text-[15px] font-medium text-slate-600 bg-white">
                                                    {format(new Date(entry.clock_out), 'HH:mm:ss')}
                                                </div>
                                            ) : (
                                                <div className="w-32 h-12 border border-amber-200/50 rounded flex items-center justify-center bg-amber-50">
                                                    <span className="text-amber-700 text-[10px] font-bold uppercase tracking-widest animate-pulse">En curso</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-800 text-base">
                                            {entry.clock_out ? (() => {
                                                const diff = new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()
                                                const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0')
                                                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0')
                                                const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0')
                                                return `${h}:${m}:${s}`
                                            })() : '00:00:00'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5 items-start">
                                                <div className="flex items-center gap-2">
                                                    <span className={`${getOriginStyles(entry.origin)} px-2 py-0.5 rounded-[4px] border text-[11px] font-black`}>
                                                        {formatOrigin(entry.origin)}
                                                    </span>
                                                    <Badge className={`${getEntryTypeStyles(entry.entry_type)} text-[10px] font-bold px-2 py-0 h-5 rounded shadow-none border`}>
                                                        {formatEntryType(entry.entry_type)}
                                                    </Badge>
                                                </div>
                                                {entry.is_incident && (
                                                    <Badge className="bg-[#fff1f2] text-[#e11d48] text-[9px] font-bold px-2 py-0 h-5 rounded shadow-none border-none uppercase tracking-widest">
                                                        Incidencia
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[240px] min-w-[200px] py-6">
                                            <div className="flex flex-col gap-0.5">
                                                <p className="text-[12px] font-bold text-[#3b60c1]/60 leading-tight break-words whitespace-normal">
                                                    {entry.is_incident ? (entry.incident_reason || 'Incidencia: Salida no registrada.') : (entry.correction_reason || '-')}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {(() => {
                                                const isHardware = entry.origin?.toLowerCase().includes('hardware') || entry.origin?.toLowerCase().includes('tablet') || entry.origin?.toLowerCase().includes('terminal');
                                                const hasCoords = !!(entry.gps_lat && entry.gps_long);
                                                return (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={`h-10 w-10 p-0 rounded-full transition-all ${isHardware ? 'opacity-20 cursor-default' : hasCoords ? 'text-[#3b60c1] hover:bg-blue-50' : 'text-slate-300 cursor-not-allowed'}`}
                                                        onClick={() => !isHardware && hasCoords && setSelectedCoords({ lat: entry.gps_lat, lng: entry.gps_long })}
                                                    >
                                                        <MapPin className="h-6 w-6" />
                                                    </Button>
                                                )
                                            })()}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditClick(entry)}
                                                className="h-10 w-10 p-0 rounded-full text-slate-900 hover:bg-slate-100"
                                            >
                                                <Pencil className="h-6 w-6 stroke-[1.5]" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {initialEntries?.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-lg border border-dashed border-slate-200 mx-1">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <HistoryIcon className="text-slate-200" size={32} />
                            </div>
                            <p className="text-slate-400 font-bold tracking-tight">Sin actividad registrada</p>
                            <p className="text-slate-300 text-xs mt-1">No hemos encontrado ningún fichaje con estos criterios.</p>
                        </div>
                    )}

                </div>

                <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
                    <DialogContent className="rounded-lg sm:max-w-[440px] p-0 overflow-hidden border-none shadow-2xl">
                        {editingEntry && (
                            <div className="p-6 space-y-5 bg-white">
                                <div>
                                    <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                                        <HistoryIcon size={18} className="text-[#3b60c1]" />
                                        {isAdmin ? 'Corregir Jornada' : 'Justificar Incidencia'}
                                    </DialogTitle>
                                    <DialogDescription className="text-slate-400 font-medium text-xs mt-1">
                                        {isAdmin
                                            ? 'Ajusta los horarios detectados. Los cambios serán auditados.'
                                            : 'Indica el motivo de la incidencia o corrección necesaria.'}
                                    </DialogDescription>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold uppercase tracking-widest text-[#3b60c1] flex items-center gap-2 leading-none">
                                            <Clock size={12} /> Hora de Entrada
                                        </Label>
                                        <Input
                                            type="datetime-local"
                                            className={`h-14 rounded-lg font-semibold text-base text-slate-900 border-slate-200 transition-all shadow-inner tabular-nums p-4 ${!isAdmin ? 'bg-slate-100 opacity-60 cursor-not-allowed' : 'bg-slate-50 focus:bg-white'}`}
                                            value={start}
                                            onChange={(e) => setStart(e.target.value)}
                                            readOnly={!isAdmin}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 leading-none">
                                            <Clock size={12} /> Hora de Salida
                                        </Label>
                                        <Input
                                            type="datetime-local"
                                            className={`h-14 rounded-lg font-semibold text-base text-slate-900 border-slate-200 transition-all shadow-inner tabular-nums p-4 ${!isAdmin ? 'bg-slate-100 opacity-60 cursor-not-allowed' : 'bg-slate-50 focus:bg-white'}`}
                                            value={end}
                                            onChange={(e) => setEnd(e.target.value)}
                                            readOnly={!isAdmin}
                                        />
                                    </div>
                                </div>

                                {/* Compact Live Duration Preview */}
                                <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
                                        <Clock size={18} className="text-[#3b60c1]" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Nueva Duración</p>
                                        <p className="text-xl font-bold text-slate-900 tabular-nums leading-none">
                                            {calculateDuration(start, end)}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 leading-none">
                                        <Pencil size={12} /> Motivo del Ajuste
                                    </Label>
                                    <Textarea
                                        className="rounded-lg border-slate-200 min-h-[90px] font-medium p-4 bg-slate-50 focus:bg-white transition-all text-sm leading-snug"
                                        placeholder="Justifica el cambio..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                    />
                                </div>

                                <DialogFooter className="pt-2">
                                    <Button
                                        onClick={handleSave}
                                        disabled={!reason.trim() || isPending}
                                        className="w-full h-14 bg-[#3b60c1] hover:bg-[#2d4a94] text-white font-bold rounded-xl shadow-none flex gap-2 active:scale-95 transition-all text-sm uppercase tracking-widest"
                                    >
                                        {isPending ? (
                                            <Loader2 className="animate-spin h-6 w-6" />
                                        ) : (
                                            <>
                                                Guardar Cambios
                                                <ArrowRight size={18} />
                                            </>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <Dialog open={!!selectedCoords} onOpenChange={(open) => !open && setSelectedCoords(null)}>
                    <DialogContent className="sm:max-w-[600px] h-[500px] p-0 overflow-hidden border-none shadow-2xl">
                        <DialogHeader className="p-6 bg-white border-b border-slate-100">
                            <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                                <MapPin size={18} className="text-[#3b60c1]" />
                                Ubicación del Fichaje
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 font-medium text-xs mt-1">
                                Punto exacto donde se registró la jornada.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 w-full h-full min-h-[400px] bg-slate-50">
                            {selectedCoords && (
                                <iframe
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    allowFullScreen
                                    src={`https://maps.google.com/maps?q=${selectedCoords.lat},${selectedCoords.lng}&z=15&output=embed`}
                                ></iframe>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    )
}

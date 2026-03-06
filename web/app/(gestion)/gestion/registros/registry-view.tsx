'use client'

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { getRegistryData } from './actions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Search } from 'lucide-react'
import { EditEntryDialog } from './edit-entry-dialog'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { LayoutGrid, AlertTriangle } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export function RegistryView({
    departments = [],
    isAdmin
}: {
    departments?: { id: string, name: string }[],
    isAdmin: boolean
}) {
    // Initial date in local time YYYY-MM-DD
    const [date, setDate] = useState(() => {
        const now = new Date()
        const offset = now.getTimezoneOffset() * 60000
        return new Date(now.getTime() - offset).toISOString().split('T')[0]
    })
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [deptFilter, setDeptFilter] = useState('all')
    const [error, setError] = useState<string | null>(null)

    // Edit State
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [selectedEntry, setSelectedEntry] = useState<any>(null)
    const [selectedEmployee, setSelectedEmployee] = useState('')
    const [selectedSchedule, setSelectedSchedule] = useState('')

    // Filter Application with Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            async function fetchData() {
                setLoading(true)
                setError(null)
                const res = await getRegistryData(date, deptFilter)
                if (res.error) {
                    setError(res.error)
                } else if (res.employees) {
                    setData(res.employees)
                }
                setLoading(false)
            }
            fetchData()
        }, 500)

        return () => clearTimeout(timer)
    }, [date, deptFilter])

    const filteredData = data.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    function formatHours(h: number) {
        const hours = Math.floor(Math.abs(h))
        const minutes = Math.round((Math.abs(h) - hours) * 60)
        const sign = h < 0 ? '-' : ''
        return `${sign}${hours}:${minutes.toString().padStart(2, '0')}`
    }

    const hoursArr = Array.from({ length: 24 }, (_, i) => i)

    return (
        <TooltipProvider>
            <div className="space-y-10">
                {/* Filtros Premium */}
                <div className="bg-white rounded-lg border border-slate-100 shadow-xl shadow-slate-900/5 transition-all overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-1 bg-[#3b60c1] rounded-full"></div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Panel de Control de Presencia</h3>
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end">
                        <div className="grid gap-3 w-full">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Fecha de Consulta</Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="h-12 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 focus:border-[#3b60c1] transition-all shadow-sm"
                            />
                        </div>

                        {isAdmin && (
                            <div className="grid gap-3 w-full">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Departamento</Label>
                                <Select value={deptFilter} onValueChange={setDeptFilter}>
                                    <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 shadow-sm text-slate-900 flex items-center">
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg border-slate-100 shadow-xl">
                                        <SelectItem value="all" className="font-bold">Todos</SelectItem>
                                        {departments.map((d) => (
                                            <SelectItem key={d.id} value={d.id} className="font-bold">{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid gap-3 flex-1 w-full">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Filtrar Empleado</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Nombre del empleado..."
                                    className="pl-10 h-12 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 focus:border-[#3b60c1] transition-all shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end h-12">
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jornada Consultada</p>
                                <p className="text-sm font-black text-[#3b60c1] uppercase tracking-tight">
                                    {format(new Date(date), 'PPPP', { locale: es })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-100 shadow-2xl shadow-slate-900/5 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-1 bg-amber-500 rounded-full"></div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Cuadrante de Presencia Laboral</h3>
                        </div>
                    </div>
                    {error && (
                        <div className="p-8 text-center text-red-500 bg-red-50 border-b">
                            <p className="font-semibold">{error}</p>
                            <p className="text-sm">Si el problema persiste, contacta con soporte.</p>
                        </div>
                    )}
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow className="bg-slate-50/80 border-b border-slate-100 hover:bg-slate-50/80">
                                    <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 w-[200px] border-r border-slate-100">Empleado</TableHead>
                                    <TableHead className="py-5 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center w-[55px] border-r border-slate-100">Prog</TableHead>
                                    <TableHead className="py-5 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center w-[55px] border-r border-slate-100">Trab</TableHead>
                                    <TableHead className="py-5 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center w-[55px] border-r border-slate-100">Dif</TableHead>
                                    {hoursArr.map(h => (
                                        <TableHead key={h} className="text-center p-0 min-w-[28px] text-[9px] font-black text-slate-400 border-r border-slate-100/30 last:border-r-0">
                                            {h.toString().padStart(2, '0')}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={28} className="text-center py-20 text-muted-foreground">
                                            Cargando datos...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={28} className="text-center py-20 text-muted-foreground">
                                            <p>{searchTerm ? 'No se encontraron empleados con ese nombre.' : 'No hay empleados registrados para este día.'}</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredData.map((emp) => {
                                        const hasIncident = emp.entries.some((en: any) => en.is_incident)
                                        return (
                                            <TableRow key={emp.id} className={`group h-14 transition-colors hover:bg-blue-50/30 border-b border-slate-50 ${hasIncident ? 'bg-rose-50/30' : ''}`}>
                                                <TableCell className={`py-3 px-6 border-r border-slate-100 ${hasIncident ? 'border-l-4 border-l-rose-500' : ''}`}>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-black text-slate-900 tracking-tight">{emp.name}</span>
                                                            {hasIncident && (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="cursor-help"><AlertTriangle className="h-3.5 w-3.5 text-rose-500 fill-rose-50" /></div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="bg-slate-900 border-slate-800 text-white rounded-lg">
                                                                        <p className="text-[10px] font-black uppercase tracking-widest">Incidencia Detectada</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                        </div>
                                                        {emp.dept_name && (
                                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-tight">
                                                                <LayoutGrid className="h-2.5 w-2.5" strokeWidth={3} />
                                                                {emp.dept_name}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center border-r border-slate-100 text-[11px] font-bold text-slate-400 tabular-nums">
                                                    {formatHours(emp.prog)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center border-r border-slate-100 text-[11px] font-black text-slate-900 tabular-nums">
                                                    {formatHours(emp.trab)}
                                                </TableCell>
                                                <TableCell className={`py-3 px-4 text-center border-r border-slate-100 text-[11px] font-black tabular-nums shadow-inner ${emp.dif < 0 ? 'text-rose-600 bg-rose-50/50' : emp.dif > 0 ? 'text-emerald-600 bg-emerald-50/50' : 'text-slate-300'}`}>
                                                    {formatHours(emp.dif)}
                                                </TableCell>
                                                <TableCell
                                                    colSpan={24}
                                                    className="p-0 relative h-14 min-w-[672px] border-r border-slate-100 last:border-r-0 bg-slate-50/20"
                                                >
                                                    <div className="absolute inset-0 flex pointer-events-none">
                                                        {hoursArr.map(h => (
                                                            <div key={h} className="flex-1 border-r last:border-r-0 h-full border-slate-200/40" />
                                                        ))}
                                                    </div>

                                                    <div className="absolute inset-x-0 bottom-1 h-1 px-0 pointer-events-none z-10">
                                                        {emp.scheduleType === 'fixed' && emp.rawSchedule && (
                                                            <>
                                                                {(() => {
                                                                    const s = emp.rawSchedule
                                                                    const slots = []
                                                                    if (s.start_time && s.end_time) slots.push({ start: s.start_time, end: s.end_time })
                                                                    if (s.start_time_2 && s.end_time_2) slots.push({ start: s.start_time_2, end: s.end_time_2 })

                                                                    return slots.map((slot, idx) => {
                                                                        const [sh, sm] = slot.start.split(':').map(Number)
                                                                        const [eh, em] = slot.end.split(':').map(Number)
                                                                        const startP = ((sh * 60 + sm) / (24 * 60)) * 100
                                                                        const endP = ((eh * 60 + em) / (24 * 60)) * 100
                                                                        const w = endP - startP

                                                                        return (
                                                                            <div
                                                                                key={idx}
                                                                                className="absolute h-[1px] bg-slate-400/30 border-b border-dashed border-slate-400/50"
                                                                                style={{ left: `${startP}%`, width: `${w}%` }}
                                                                            />
                                                                        )
                                                                    })
                                                                })()}
                                                            </>
                                                        )}
                                                    </div>

                                                    <div className="absolute inset-0 py-3.5">
                                                        <div className="relative w-full h-full">
                                                            {emp.entries.length === 0 && (
                                                                <div className="absolute inset-0 flex items-center pl-4 text-[9px] text-slate-300 font-black uppercase tracking-widest opacity-40">
                                                                    Sin actividad
                                                                </div>
                                                            )}
                                                            {emp.entries.map((entry: any, i: number) => {
                                                                const start = new Date(entry.start)
                                                                const isToday = new Date().toISOString().split('T')[0] === date
                                                                const entryEnd = entry.end ? new Date(entry.end) : (isToday ? new Date() : new Date(new Date(entry.start).setHours(23, 59, 59, 999)))

                                                                const startPercent = ((start.getHours() * 60 + start.getMinutes()) / (24 * 60)) * 100
                                                                const endPercent = ((entryEnd.getHours() * 60 + entryEnd.getMinutes()) / (24 * 60)) * 100
                                                                const width = endPercent < startPercent ? (100 - startPercent) : (endPercent - startPercent)
                                                                const safeWidth = Math.max(1.5, width)

                                                                let color = "bg-emerald-500"
                                                                let shadow = "shadow-emerald-100"
                                                                if (entry.is_incident) {
                                                                    color = "bg-rose-600 animate-pulse border-rose-800 shadow-rose-200"
                                                                    shadow = "shadow-rose-300"
                                                                } else {
                                                                    if (entry.type === 'remote_work') { color = "bg-[#3b60c1]"; shadow = "shadow-blue-100"; }
                                                                    if (entry.type === 'break') { color = "bg-slate-400"; shadow = "shadow-slate-100"; }
                                                                    if (entry.type === 'medical') { color = "bg-rose-500"; shadow = "shadow-rose-100"; }
                                                                    if (entry.type === 'training') { color = "bg-amber-500"; shadow = "shadow-amber-100"; }
                                                                    if (entry.type === 'work') { color = "bg-emerald-600"; shadow = "shadow-emerald-100"; }
                                                                }

                                                                return (
                                                                    <Tooltip key={i}>
                                                                        <TooltipTrigger asChild>
                                                                            <div
                                                                                className={`absolute inset-y-0 rounded-lg shadow-sm ${color} ${shadow} border border-black/5 flex items-center justify-center overflow-hidden z-20 cursor-pointer hover:brightness-110 transition-all ${entry.is_manual_correction ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
                                                                                style={{
                                                                                    left: `${startPercent}%`,
                                                                                    width: `${safeWidth}%`
                                                                                }}
                                                                                onClick={() => {
                                                                                    setSelectedEntry(entry)
                                                                                    setSelectedEmployee(emp.name)
                                                                                    setSelectedSchedule(emp.schedule)
                                                                                    setEditDialogOpen(true)
                                                                                }}
                                                                            >
                                                                                {safeWidth > 8 && (
                                                                                    <span className="text-[8px] text-white font-black uppercase tracking-tighter truncate leading-none pointer-events-none drop-shadow-sm px-1">
                                                                                        {entry.is_incident ? 'OUT' : entry.type === 'remote_work' ? 'HOME' : entry.type === 'work' ? 'OFF' : entry.type.slice(0, 3)}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="bg-slate-900 border-slate-800 text-white p-4 shadow-2xl rounded-lg">
                                                                            <div className="space-y-2">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className={`w-1.5 h-1.5 rounded-full ${color}`}></div>
                                                                                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">{entry.is_incident ? 'Incidencia Detectada' : 'Fichaje Registrado'}</p>
                                                                                </div>
                                                                                <p className="text-sm font-black tabular-nums">{format(start, 'HH:mm')} — {entry.end ? format(new Date(entry.end), 'HH:mm') : 'En curso'}</p>
                                                                                {entry.is_incident && <p className="text-[10px] text-rose-300 font-bold uppercase tracking-tight py-1 px-2 bg-rose-500/10 rounded border border-rose-500/20">{entry.incident_reason}</p>}
                                                                                {entry.is_manual_correction && <p className="text-[10px] text-amber-300 font-bold">Manual: {entry.correction_reason}</p>}
                                                                            </div>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <EditEntryDialog
                    entry={selectedEntry}
                    employeeName={selectedEmployee}
                    scheduledHours={selectedSchedule}
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    onSuccess={() => {
                        // Refetch data
                        getRegistryData(date).then(res => {
                            if (res.employees) setData(res.employees)
                        })
                    }}
                />

                <div className="flex flex-wrap gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-8 py-8 bg-slate-50/50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-3"><div className="w-4 h-4 bg-emerald-600 rounded-lg shadow-sm shadow-emerald-100"></div> Presencial</div>
                    <div className="flex items-center gap-3"><div className="w-4 h-4 bg-rose-600 rounded-lg shadow-sm shadow-rose-200 animate-pulse ring-1 ring-rose-500 ring-offset-1"></div> Incidencia</div>
                </div>
            </div>
        </TooltipProvider>
    )
}

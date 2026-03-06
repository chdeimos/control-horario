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

    useEffect(() => {
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

    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
        <TooltipProvider>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end gap-4 bg-white p-4 rounded-lg shadow-sm border">
                    <div className="grid gap-1.5 w-full md:w-auto">
                        <Label htmlFor="date">Fecha</Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            className="w-full md:w-44"
                            onChange={(e) => setDate(e.target.value)}
                        />
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

                    <div className="grid gap-1.5 flex-1">
                        <Label htmlFor="search">Buscar Empleado</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="search"
                                type="search"
                                placeholder="Nombre del empleado..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="ml-auto text-sm text-muted-foreground hidden lg:block">
                        {format(new Date(date), 'PPPP', { locale: es })}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    {error && (
                        <div className="p-8 text-center text-red-500 bg-red-50 border-b">
                            <p className="font-semibold">{error}</p>
                            <p className="text-sm">Si el problema persiste, contacta con soporte.</p>
                        </div>
                    )}
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50">
                                    <TableHead className="w-[200px] border-r">Empleado</TableHead>
                                    <TableHead className="text-center w-[60px] border-r">Prog</TableHead>
                                    <TableHead className="text-center w-[60px] border-r">Trab</TableHead>
                                    <TableHead className="text-center w-[60px] border-r">Dif</TableHead>
                                    {hours.map(h => (
                                        <TableHead key={h} className="text-center p-0 min-w-[25px] text-[10px] font-medium border-r last:border-r-0">
                                            {h}
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
                                            <TableRow key={emp.id} className={`hover:bg-gray-50/50 h-10 ${hasIncident ? 'bg-red-50/10' : ''}`}>
                                                <TableCell className={`font-medium border-r py-2 ${hasIncident ? 'border-l-4 border-l-red-500' : ''}`}>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[#3b60c1] font-semibold">{emp.name}</span>
                                                            {hasIncident && (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="cursor-help"><AlertTriangle className="h-3.5 w-3.5 text-red-500" /></div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p className="text-xs font-medium">Incidencia horaria detectada</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                        </div>
                                                        {emp.dept_name && (
                                                            <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase tracking-wider">
                                                                <LayoutGrid className="h-2.5 w-2.5" />
                                                                {emp.dept_name}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center border-r text-gray-500 text-sm">
                                                    {formatHours(emp.prog)}
                                                </TableCell>
                                                <TableCell className="text-center border-r font-medium text-sm">
                                                    {formatHours(emp.trab)}
                                                </TableCell>
                                                <TableCell className={`text-center border-r text-sm font-semibold ${emp.dif < 0 ? 'text-red-500' : emp.dif > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {formatHours(emp.dif)}
                                                </TableCell>
                                                <TableCell
                                                    colSpan={24}
                                                    className="p-0 relative h-10 min-w-[600px] border-r last:border-r-0 bg-gray-50/5"
                                                >
                                                    <div className="absolute inset-0 flex pointer-events-none">
                                                        {hours.map(h => (
                                                            <div key={h} className="flex-1 border-r last:border-r-0 h-full border-gray-100/50" />
                                                        ))}
                                                    </div>

                                                    <div className="absolute inset-0 py-2">
                                                        <div className="relative w-full h-full">
                                                            {emp.entries.length === 0 && (
                                                                <div className="absolute inset-0 flex items-center pl-4 text-[10px] text-gray-400 italic font-mono uppercase tracking-tighter opacity-50">
                                                                    Sin registros
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

                                                                let color = "bg-green-500"
                                                                if (entry.is_incident) color = "bg-red-600 animate-pulse border-red-800 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                                                                else {
                                                                    if (entry.type === 'remote_work') color = "bg-blue-500"
                                                                    if (entry.type === 'break') color = "bg-gray-400"
                                                                    if (entry.type === 'medical') color = "bg-red-500"
                                                                    if (entry.type === 'training') color = "bg-amber-500"
                                                                    if (entry.type === 'work') color = "bg-green-600"
                                                                }

                                                                return (
                                                                    <Tooltip key={i}>
                                                                        <TooltipTrigger asChild>
                                                                            <div
                                                                                className={`absolute inset-y-0 rounded shadow-sm ${color} border border-black/10 flex items-center justify-center overflow-hidden z-20 cursor-pointer hover:brightness-110 transition-all ${entry.is_manual_correction ? 'ring-2 ring-amber-400' : ''}`}
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
                                                                                {safeWidth > 10 && (
                                                                                    <span className="text-[7px] text-white font-bold uppercase truncate leading-none pointer-events-none">
                                                                                        {entry.is_incident ? 'FUERA' : entry.type === 'remote_work' ? 'REMOTO' : entry.type === 'work' ? 'PRES' : entry.type}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <div className="text-xs space-y-1">
                                                                                <p className="font-bold">{entry.is_incident ? 'Incidencia Detectada' : 'Fichaje'}</p>
                                                                                <p>{format(start, 'HH:mm')} - {entry.end ? format(new Date(entry.end), 'HH:mm') : 'En curso'}</p>
                                                                                {entry.is_incident && <p className="text-red-200 mt-1 italic font-medium">{entry.incident_reason}</p>}
                                                                                {entry.is_manual_correction && <p className="text-amber-200">Manual: {entry.correction_reason}</p>}
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

                <div className="flex gap-6 text-xs text-muted-foreground px-2">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> Presencial</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Teletrabajo</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-gray-300 rounded-sm"></div> Pausa</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-400 rounded-sm"></div> Médico</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-400 rounded-sm"></div> Formación</div>
                </div>
            </div>
        </TooltipProvider>
    )
}

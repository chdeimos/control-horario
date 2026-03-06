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
import { useState, useTransition } from "react"
import { Pencil, Search, X, ChevronLeft, ChevronRight, LayoutGrid, AlertTriangle, MapPin } from "lucide-react"
import { updateTimeEntry } from "@/app/(dashboard)/dashboard/actions"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
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
    departments = []
}: {
    initialEntries: any[],
    isAdmin: boolean,
    totalCount: number,
    departments?: { id: string, name: string }[]
}) {
    const [editingEntry, setEditingEntry] = useState<any>(null)
    const [reason, setReason] = useState("")
    const [start, setStart] = useState("")
    const [end, setEnd] = useState("")
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number, lng: number } | null>(null)

    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    // Filter States
    const [empSearch, setEmpSearch] = useState(searchParams.get('search') || '')
    const [fromDate, setFromDate] = useState(searchParams.get('from') || '')
    const [toDate, setToDate] = useState(searchParams.get('to') || '')
    const [deptFilter, setDeptFilter] = useState(searchParams.get('department') || 'all')

    const currentPage = parseInt(searchParams.get('page') || '1')
    const pageSize = searchParams.get('pageSize') || '25'

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

    const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalCount / parseInt(pageSize))

    return (
        <TooltipProvider>
            <div className="space-y-4">
                {/* Filtros */}
                <div className="flex flex-col md:flex-row gap-4 items-end bg-white p-4 rounded-lg border shadow-sm">
                    {isAdmin && (
                        <>
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
                                        <SelectValue placeholder="Todos los departamentos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        {departments.map((d) => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                    <div className="grid gap-1.5 w-full md:w-40">
                        <Label>Desde</Label>
                        <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                    </div>
                    <div className="grid gap-1.5 w-full md:w-40">
                        <Label>Hasta</Label>
                        <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button onClick={applyFilters} className="flex-1 md:flex-none bg-[#3b60c1] hover:bg-[#2d4a94] text-white">Buscar</Button>
                        {(empSearch || fromDate || toDate || (deptFilter !== 'all')) && (
                            <Button variant="outline" size="icon" onClick={clearFilters}>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50">
                                {isAdmin && <TableHead>Empleado</TableHead>}
                                <TableHead>Fecha</TableHead>
                                <TableHead>Entrada</TableHead>
                                <TableHead>Salida</TableHead>
                                <TableHead>Duración</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Origen</TableHead>
                                <TableHead className="text-center">Ubicación</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialEntries?.map((entry) => (
                                <TableRow
                                    key={entry.id}
                                    className={entry.is_incident
                                        ? "bg-red-50/70 border-l-4 border-l-red-500"
                                        : undefined
                                    }
                                >
                                    {isAdmin && (
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span className="text-primary font-semibold">{entry.profiles?.full_name}</span>
                                                {entry.profiles?.departments?.name && (
                                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                                                        <LayoutGrid className="h-2.5 w-2.5" />
                                                        {entry.profiles.departments.name}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {format(new Date(entry.clock_in), 'PPP', { locale: es })}
                                            {entry.is_incident && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="cursor-help">
                                                            <AlertTriangle className="h-4 w-4 text-red-500" />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="max-w-xs text-xs font-medium">{entry.incident_reason}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`font-mono text-xs ${entry.is_incident ? 'border-red-200 bg-red-50 text-red-700' : ''}`}>
                                            {format(new Date(entry.clock_in), 'HH:mm:ss')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {entry.clock_out ? (
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {format(new Date(entry.clock_out), 'HH:mm:ss')}
                                            </Badge>
                                        ) : (
                                            <span className="text-amber-500 text-[10px] font-bold uppercase tracking-tighter animate-pulse border border-amber-200 rounded px-1.5 py-0.5 bg-amber-50">En curso</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                                        {calculateDuration(entry.clock_in, entry.clock_out)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <Badge className={`${getEntryTypeStyles(entry.entry_type)} capitalize text-[10px] h-5 border shadow-none`}>
                                                {formatEntryType(entry.entry_type)}
                                            </Badge>
                                            {entry.is_incident && <Badge className="bg-red-600 text-white hover:bg-red-700 text-[9px] px-1 h-4 uppercase font-bold tracking-tighter border-none">Incidencia</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`${getOriginStyles(entry.origin)} px-2 py-0.5 rounded-[4px] border text-[10px] font-black`}>
                                            {formatOrigin(entry.origin)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {(() => {
                                            const isHardware = entry.origin?.toLowerCase().includes('hardware') || entry.origin?.toLowerCase().includes('tablet') || entry.origin?.toLowerCase().includes('terminal');
                                            const hasCoords = !!(entry.gps_lat && entry.gps_long);

                                            return (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={`h-8 w-8 p-0 ${isHardware ? 'opacity-20 cursor-default' : hasCoords ? 'text-primary hover:text-primary hover:bg-blue-50' : 'text-slate-300 cursor-not-allowed'}`}
                                                            onClick={() => {
                                                                if (!isHardware && hasCoords) {
                                                                    setSelectedCoords({ lat: entry.gps_lat, lng: entry.gps_long });
                                                                }
                                                            }}
                                                        >
                                                            <MapPin className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="text-xs">
                                                            {isHardware ? 'Fichaje desde terminal físico (GPS no requerido)' : hasCoords ? 'Ver ubicación en Google Maps' : 'Ubicación no disponible'}
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )
                                        })()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditClick(entry)}
                                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-primary"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {initialEntries?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-12 text-muted-foreground italic">
                                        No se han encontrado registros con los filtros aplicados.
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
                                    <SelectItem value="500">500</SelectItem>
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

                <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Corregir Fichaje</DialogTitle>
                            <DialogDescription>
                                Modifica las horas. Debes justificar el cambio obligatoriamente.
                            </DialogDescription>
                        </DialogHeader>

                        {editingEntry && (
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Entrada</Label>
                                    <Input
                                        type="datetime-local"
                                        className="col-span-3"
                                        value={start}
                                        onChange={(e) => setStart(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Salida</Label>
                                    <Input
                                        type="datetime-local"
                                        className="col-span-3"
                                        value={end}
                                        onChange={(e) => setEnd(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Motivo</Label>
                                    <Textarea
                                        className="col-span-3"
                                        placeholder="Ej: Olvidé fichar al salir..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingEntry(null)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={!reason.trim() || isPending} className="bg-[#3b60c1] hover:bg-[#2d4a94] text-white">
                                {isPending ? "Guardando..." : "Guardar Cambios"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={!!selectedCoords} onOpenChange={(open) => !open && setSelectedCoords(null)}>
                    <DialogContent className="sm:max-w-[600px] h-[500px] p-0 overflow-hidden">
                        <DialogHeader className="p-4 border-b">
                            <DialogTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                Ubicación del Fichaje
                            </DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 w-full h-full min-h-[400px]">
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

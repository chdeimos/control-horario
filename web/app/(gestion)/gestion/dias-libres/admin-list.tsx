'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateRequestStatus, deleteTimeOffRequest } from "./actions"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Search, X, Clock, Check, Calendar } from "lucide-react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function AdminRequestsList({
    requests,
    initialStatus
}: {
    requests: any[],
    initialStatus?: string
}) {
    const router = useRouter()
    const [filter, setFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState(initialStatus || "all")
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [sort, setSort] = useState("pending")

    // Rejection Dialog State
    const [rejectOpen, setRejectOpen] = useState(false)
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
    const [rejectionReason, setRejectionReason] = useState("")

    async function handleStatusChange(id: string, newStatus: 'pending' | 'approved' | 'rejected', note?: string) {
        if (newStatus === 'rejected' && !note) {
            setSelectedRequestId(id)
            setRejectionReason("")
            setRejectOpen(true)
            return
        }

        setLoadingId(id)
        try {
            const res = await updateRequestStatus(id, newStatus, note)
            if (res?.error) {
                toast.error(`Error: ${res.error}`)
            } else {
                toast.success('Estado actualizado')
                if (rejectOpen) setRejectOpen(false)
                router.refresh()
            }
        } catch (err) {
            console.error(err)
            toast.error("Error de conexión o servidor.")
        }
        setLoadingId(null)
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de que quieres borrar esta solicitud permanentemente?')) return
        setLoadingId(id)
        const res = await deleteTimeOffRequest(id)
        setLoadingId(null)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Solicitud borrada')
            router.refresh()
        }
    }

    async function confirmRejection() {
        if (!selectedRequestId) return
        if (!rejectionReason.trim()) {
            toast.error("Por favor, indica un motivo.")
            return
        }
        await handleStatusChange(selectedRequestId, 'rejected', rejectionReason)
    }

    const filteredRequests = requests.filter(req => {
        const matchesName = req.profiles?.full_name?.toLowerCase().includes(filter.toLowerCase()) ||
            req.request_type.toLowerCase().includes(filter.toLowerCase())
        const matchesStatus = statusFilter === "all" || req.status === statusFilter
        return matchesName && matchesStatus
    })

    const sortedRequests = [...filteredRequests].sort((a, b) => {
        if (sort === "pending") {
            if (a.status === 'pending' && b.status !== 'pending') return -1
            if (a.status !== 'pending' && b.status === 'pending') return 1
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        }
        if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        return 0
    })

    return (
        <div className="space-y-0">
            {/* Filtros Grid Premium */}
            <div className="p-8 border-b border-slate-100 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-end">
                    <div className="grid gap-3 w-full">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Buscar Empleado o Tipo</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Nombre, vacaciones..."
                                className="pl-10 h-12 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 focus:border-[#3b60c1] transition-all flex items-center"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-3 w-full">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Estado de Solicitud</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 shadow-sm text-slate-900 flex items-center">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border-slate-100 shadow-xl">
                                <SelectItem value="all" className="font-bold">Todos los estados</SelectItem>
                                <SelectItem value="pending" className="font-bold">⏳ Pendientes</SelectItem>
                                <SelectItem value="approved" className="font-bold">✅ Aprobadas</SelectItem>
                                <SelectItem value="rejected" className="font-bold">❌ Rechazadas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-3 w-full">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Orden de Visualización</Label>
                        <Select value={sort} onValueChange={setSort}>
                            <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 shadow-sm text-slate-900 flex items-center">
                                <SelectValue placeholder="Ordenar por..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border-slate-100 shadow-xl">
                                <SelectItem value="pending" className="font-bold">⏳ Pendientes primero</SelectItem>
                                <SelectItem value="newest" className="font-bold">✨ Más recientes</SelectItem>
                                <SelectItem value="oldest" className="font-bold">📆 Más antiguas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-slate-100">
                {sortedRequests.map(req => (
                    <div
                        key={req.id}
                        className={`p-8 group transition-all flex flex-col md:flex-row items-start justify-between gap-8 ${req.status === 'pending' ? 'bg-amber-50/40 hover:bg-amber-50/60' :
                            req.status === 'approved' ? 'bg-emerald-50/40 hover:bg-emerald-50/60' :
                                req.status === 'rejected' ? 'bg-rose-50/40 hover:bg-rose-50/60' :
                                    'bg-white hover:bg-blue-50/20'
                            }`}
                    >
                        {/* Info Section */}
                        <div className="flex-1 space-y-4">
                            <div className="flex flex-col gap-2">
                                <h4 className="text-xl font-black text-slate-900 tracking-tighter decoration-[#3b60c1]/10 decoration-4 underline-offset-4 underline group-hover:decoration-[#3b60c1]/30 transition-all">
                                    {req.profiles?.full_name}
                                </h4>
                                <div className="flex flex-wrap items-center gap-3">
                                    <Badge className={`${req.request_type === 'vacation' ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-blue-100 text-blue-600 border-blue-200'} font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg border shadow-sm`}>
                                        {req.request_type === 'vacation' ? '☀️ Vacaciones' :
                                            req.request_type === 'personal' ? '🏠 Asuntos Propios' :
                                                req.request_type === 'medical' ? '🏥 Baja Médica' : req.request_type}
                                    </Badge>
                                    <div className="h-4 w-[1px] bg-slate-200" />
                                    <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-tight">
                                        <Calendar className="h-3.5 w-3.5 text-[#3b60c1]" />
                                        {format(new Date(req.start_date), 'dd MMM yyyy', { locale: es })} — {format(new Date(req.end_date), 'dd MMM yyyy', { locale: es })}
                                    </div>
                                </div>
                            </div>

                            {req.reason && (
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 max-w-2xl">
                                    <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                                        "{req.reason}"
                                    </p>
                                </div>
                            )}

                            {req.status === 'rejected' && req.manager_note && (
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-3">
                                    <X className="h-4 w-4 text-rose-600 stroke-[3px]" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">
                                        RECHAZADO: <span className="text-slate-700 italic lowercase font-medium normal-case ml-2">"{req.manager_note}"</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Control Section */}
                        <div className="shrink-0 flex flex-col items-end gap-6 w-full md:w-auto">
                            {req.balances && (
                                <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100 w-full md:w-auto">
                                    <div className="text-right">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Vacaciones</p>
                                        <p className="text-sm font-black text-slate-900 tabular-nums">
                                            {req.balances.vacation.remaining} <span className="text-[10px] text-slate-400 font-bold">/ {req.balances.vacation.total}</span>
                                        </p>
                                    </div>
                                    <div className="h-8 w-[1px] bg-slate-200" />
                                    <div className="text-right">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Propios</p>
                                        <p className="text-sm font-black text-slate-900 tabular-nums">
                                            {req.balances.personal.remaining} <span className="text-[10px] text-slate-400 font-bold">/ {req.balances.personal.total}</span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3 w-full">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className={`h-12 flex-1 rounded-lg border-slate-200 font-black uppercase tracking-widest text-[10px] px-6 shadow-sm transition-all hover:border-[#3b60c1] hover:text-[#3b60c1] active:scale-95`}>
                                            <div className="flex items-center gap-3 justify-center">
                                                {req.status === 'approved' && <Check className="h-4 w-4 text-emerald-500" strokeWidth={3} />}
                                                {req.status === 'pending' && <Clock className="h-4 w-4 text-amber-500" strokeWidth={3} />}
                                                {req.status === 'rejected' && <X className="h-4 w-4 text-rose-500" strokeWidth={3} />}
                                                {req.status === 'pending' ? 'Pendiente' : req.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                                                <ChevronDown className="h-3.5 w-3.5 opacity-50 ml-1" />
                                            </div>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="p-2 rounded-lg border-slate-200 shadow-2xl min-w-[200px]">
                                        <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'pending')} className="flex items-center justify-between p-3 rounded-md font-black uppercase tracking-widest text-[9px] cursor-pointer">
                                            🕒 Pendiente <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'approved')} className="flex items-center justify-between p-3 rounded-md font-black uppercase tracking-widest text-[9px] cursor-pointer text-emerald-600 hover:bg-emerald-50">
                                            ✅ Aprobar <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'rejected')} className="flex items-center justify-between p-3 rounded-md font-black uppercase tracking-widest text-[9px] cursor-pointer text-rose-600 hover:bg-rose-50">
                                            ❌ Rechazar <div className="h-1.5 w-1.5 rounded-full bg-rose-500"></div>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-12 w-12 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
                                    onClick={() => handleDelete(req.id)}
                                    disabled={loadingId === req.id}
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
                {sortedRequests.length === 0 && (
                    <div className="p-32 text-center bg-slate-50/30">
                        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 mb-6 mx-auto">
                            <Search className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-lg font-black text-slate-900 tracking-tight">No hay solicitudes que mostrar</p>
                        <p className="text-sm font-medium text-slate-400 mt-2">Intenta ajustar los filtros de búsqueda</p>
                    </div>
                )}
            </div>

            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent className="sm:max-w-[480px] rounded-lg border-slate-200 shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100">
                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight text-left">Motivo del Rechazo</DialogTitle>
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mt-1">Acción Requerida</p>
                    </DialogHeader>

                    <div className="p-8">
                        <Label htmlFor="reason" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                            Explica el motivo al empleado *
                        </Label>
                        <Textarea
                            id="reason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Ej. Hay demasiada carga de trabajo para esas fechas..."
                            className="mt-3 min-h-[120px] bg-slate-50 border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-rose-500/20 shadow-sm resize-none"
                        />
                    </div>

                    <div className="p-8 pt-0 flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setRejectOpen(false)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={confirmRejection} disabled={loadingId !== null} className="h-12 px-8 rounded-lg bg-rose-600 hover:bg-rose-700 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-rose-200 transition-all hover:-translate-y-0.5 min-w-[180px]">
                            {loadingId ? 'Rechazando...' : 'Confirmar Rechazo'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

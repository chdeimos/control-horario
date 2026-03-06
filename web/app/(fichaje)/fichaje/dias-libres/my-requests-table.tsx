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
import { Pencil, Calendar, MessageSquare, ArrowRight, MoreHorizontal } from "lucide-react"
import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { editTimeOffRequest } from './actions'
import { useRouter } from "next/navigation"

export function MyRequestsTable({ requests }: { requests: any[] }) {
    const [editingRequest, setEditingRequest] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleEditSubmit(formData: FormData) {
        setLoading(true)
        const res = await editTimeOffRequest(editingRequest.id, formData)
        setLoading(false)

        if (res?.error) {
            alert(res.error)
        } else {
            setEditingRequest(null)
            router.refresh()
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-500 text-white border-green-100 shadow-green-100'
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200'
            case 'rejected': return 'bg-rose-500 text-white border-rose-100 shadow-rose-100'
            default: return 'bg-slate-100 text-slate-500'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'approved': return 'Aprobada'
            case 'pending': return 'Pendiente'
            case 'rejected': return 'Rechazada'
            default: return status
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'vacation': return 'Vacaciones'
            case 'medical': return 'Baja Médica'
            case 'personal': return 'Asuntos Propios'
            default: return 'Otro'
        }
    }

    return (
        <div className="space-y-4">
            {/* Desktop Table View - Matches Mockup */}
            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-slate-50">
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8">TIPO</TableHead>
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6">PERIODO</TableHead>
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6">ESTADO</TableHead>
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6">MOTIVO</TableHead>
                            <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8">ACCIONES</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.map((req) => (
                            <TableRow key={req.id} className="border-b border-slate-50 hover:bg-slate-50/20 transition-colors">
                                <TableCell className="py-8 px-8">
                                    <span className="font-bold text-slate-700 text-[15px]">{getTypeLabel(req.request_type)}</span>
                                </TableCell>
                                <TableCell className="py-8">
                                    <div className="flex items-center gap-3 text-slate-600 font-medium">
                                        <span>{new Date(req.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                        <ArrowRight size={14} className="text-slate-300" />
                                        <span>{new Date(req.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-8">
                                    <Badge className={`rounded-[4px] px-3 py-1 font-bold text-[10px] uppercase tracking-widest border-0 ${req.status === 'approved' ? 'bg-[#e7f7ed] text-[#219653]' :
                                        req.status === 'pending' ? 'bg-[#fef9c3] text-[#854d0e]' :
                                            'bg-[#fee2e2] text-[#991b1b]'
                                        }`}>
                                        {getStatusLabel(req.status)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="py-8">
                                    <p className="text-slate-500 text-[15px] italic">“{req.reason || 'Sin motivo'}”</p>
                                </TableCell>
                                <TableCell className="text-right py-8 px-8">
                                    {req.status === 'pending' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-slate-300 hover:text-[#3b60c1] transition-colors p-0 h-auto hover:bg-transparent"
                                            onClick={() => setEditingRequest(req)}
                                        >
                                            <Pencil size={24} strokeWidth={1.5} />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card List View - Redesigned from Scratch */}
            <div className="md:hidden space-y-4">
                {requests.map((req) => (
                    <div
                        key={req.id}
                        className={`bg-white rounded-[5px] border border-slate-100 shadow-lg shadow-slate-200/20 overflow-hidden relative active:scale-[0.98] transition-all`}
                    >
                        <div className={`absolute top-0 left-0 w-1 h-full ${req.status === 'approved' ? 'bg-green-500' : req.status === 'pending' ? 'bg-amber-400' : 'bg-rose-500'}`}></div>

                        <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{getTypeLabel(req.request_type)}</p>
                                    <div className="flex items-center gap-1.5 text-slate-900 font-black tracking-tight">
                                        <Calendar size={14} className="text-[#3b60c1]" />
                                        {new Date(req.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                        <span className="text-slate-300 mx-0.5">/</span>
                                        {new Date(req.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <Badge className={`rounded-[5px] px-2 py-0.5 font-bold text-[8px] uppercase tracking-[0.1em] border-0 ${getStatusColor(req.status)}`}>
                                        {getStatusLabel(req.status)}
                                    </Badge>
                                    {req.status === 'pending' && (
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-8 w-8 rounded-[5px] bg-slate-50 hover:bg-white border border-slate-100 text-slate-400"
                                            onClick={() => setEditingRequest(req)}
                                        >
                                            <Pencil size={12} />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {req.reason && (
                                <div className="bg-slate-50 rounded-[5px] p-3 flex gap-3 border border-slate-100">
                                    <MessageSquare size={14} className="text-slate-300 shrink-0 mt-0.5" />
                                    <p className="text-xs text-slate-500 italic leading-relaxed">"{req.reason}"</p>
                                </div>
                            )}

                            {req.status === 'rejected' && req.manager_note && (
                                <div className="mt-3 bg-rose-50 rounded-[5px] p-3 border border-rose-100">
                                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Motivo denegación</p>
                                    <p className="text-xs text-rose-500 font-medium italic">{req.manager_note}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {requests.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[5px] border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="text-slate-200" size={32} />
                    </div>
                    <p className="text-slate-400 font-bold tracking-tight">No tienes solicitudes registradas</p>
                    <p className="text-slate-300 text-xs mt-1">Tus ausencias aparecerán aquí una vez solicitadas.</p>
                </div>
            )}

            <Dialog open={!!editingRequest} onOpenChange={(open) => !open && setEditingRequest(null)}>
                <DialogContent className="rounded-[5px] md:rounded-[5px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tight">Editar Solicitud</DialogTitle>
                    </DialogHeader>
                    {editingRequest && (
                        <form action={handleEditSubmit} className="grid gap-6 py-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo de Ausencia</Label>
                                <Select name="type" required defaultValue={editingRequest.request_type}>
                                    <SelectTrigger className="h-12 rounded-[5px] font-bold border-slate-200 focus:ring-blue-500">
                                        <SelectValue placeholder="Tipo de ausencia" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="vacation">Vacaciones</SelectItem>
                                        <SelectItem value="medical">Baja Médica</SelectItem>
                                        <SelectItem value="personal">Asuntos Propios</SelectItem>
                                        <SelectItem value="other">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha Inicio</Label>
                                    <Input type="date" name="start" required className="h-12 rounded-[5px] font-bold border-slate-200" defaultValue={editingRequest.start_date} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha Fin</Label>
                                    <Input type="date" name="end" required className="h-12 rounded-[5px] font-bold border-slate-200" defaultValue={editingRequest.end_date} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Motivo</Label>
                                <Textarea name="reason" className="rounded-[5px] border-slate-200 min-h-[100px] font-medium" defaultValue={editingRequest.reason || ''} placeholder="Describe el motivo de la ausencia..." />
                            </div>
                            <DialogFooter className="flex-col md:flex-row gap-3">
                                <Button type="submit" disabled={loading} className="w-full md:w-auto h-12 px-8 bg-[#3b60c1] hover:bg-[#2d4a94] text-white font-black rounded-xl shadow-none transition-all active:scale-95">
                                    {loading ? 'Guardando...' : 'Actualizar Solicitud'}
                                </Button>
                                <Button type="button" variant="ghost" onClick={() => setEditingRequest(null)} className="font-bold text-slate-400">
                                    Cancelar
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

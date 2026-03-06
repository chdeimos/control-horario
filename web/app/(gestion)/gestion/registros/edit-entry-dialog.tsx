'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateTimeEntry } from './actions'
import { toast } from 'sonner'
import { AlertCircle, History, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface EditEntryDialogProps {
    entry: any
    employeeName: string
    scheduledHours?: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function EditEntryDialog({ entry, employeeName, scheduledHours, open, onOpenChange, onSuccess }: EditEntryDialogProps) {
    const [loading, setLoading] = useState(false)

    if (!entry) return null

    // Helper to format ISO to datetime-local input format
    const toInputFormat = (iso: string | null) => {
        if (!iso) return ''
        const date = new Date(iso)
        const offset = date.getTimezoneOffset() * 60000
        return new Date(date.getTime() - offset).toISOString().slice(0, 16)
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        const res = await updateTimeEntry(entry.id, formData)

        setLoading(false)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Registro actualizado e incidencia registrada.')
            onOpenChange(false)
            onSuccess()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] rounded-lg border-slate-200 shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-1.5 h-6 bg-[#3b60c1] rounded-lg"></div>
                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight text-left">Modificar Fichaje</DialogTitle>
                    </div>
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                        <History className="h-3 w-3" /> Incidencia Manual
                    </p>
                </DialogHeader>

                <div className="px-8 pt-6">
                    <div className="grid gap-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100/50">
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Empleado</span>
                            <span className="text-sm font-black text-[#3b60c1]">{employeeName}</span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em]">
                            <span className="text-slate-400">Jornada Programada</span>
                            <span className="text-slate-600 bg-white px-2 py-0.5 rounded-lg shadow-sm border border-slate-100">
                                {scheduledHours || 'Flexible'}
                            </span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label htmlFor="clock_in" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Entrada</Label>
                            <Input
                                id="clock_in"
                                name="clock_in"
                                type="datetime-local"
                                defaultValue={toInputFormat(entry.start)}
                                required
                                className="h-12 bg-white border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-blue-500/20 shadow-sm"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="clock_out" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Salida</Label>
                            <Input
                                id="clock_out"
                                name="clock_out"
                                type="datetime-local"
                                defaultValue={toInputFormat(entry.end)}
                                className="h-12 bg-white border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-blue-500/20 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="correction_reason" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                            Motivo de la Corrección *
                        </Label>
                        <Textarea
                            id="correction_reason"
                            name="correction_reason"
                            placeholder="Ej. El empleado olvidó marcar la salida al irse..."
                            defaultValue={entry.correction_reason || ''}
                            required
                            className="min-h-[100px] bg-white border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-blue-500/20 shadow-sm resize-none"
                        />
                    </div>

                    <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-100 flex gap-4">
                        <div className="h-10 w-10 bg-white rounded-lg shadow-sm flex items-center justify-center shrink-0">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                        </div>
                        <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
                            Este cambio manual será auditado como <strong>corrección administrativa</strong> y se reflejará así en los informes legales de la inspección de trabajo.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">
                            Descartar
                        </Button>
                        <Button type="submit" disabled={loading} className="h-12 px-8 rounded-lg bg-primary hover:bg-[#2d4a94] text-white font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-primary/10 transition-all hover:-translate-y-0.5 min-w-[180px] active:scale-95">
                            {loading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                            ) : (
                                'Sincronizar Registro'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

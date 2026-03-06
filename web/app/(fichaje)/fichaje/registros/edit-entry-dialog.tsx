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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-amber-500" />
                        Modificar Fichaje
                    </DialogTitle>
                    <div className="mt-2 space-y-2">
                        <DialogDescription>
                            Cualquier cambio manual se registrará como una **incidencia** para auditoría.
                        </DialogDescription>
                        <div className="flex flex-col gap-1 text-sm bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground text-xs uppercase font-semibold">Empleado</span>
                                <span className="font-bold text-[#3b60c1]">{employeeName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground text-xs uppercase font-semibold">Horario Programado</span>
                                <span className="font-mono text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                                    {scheduledHours || 'No definido'}
                                </span>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="clock_in">Entrada</Label>
                            <Input
                                id="clock_in"
                                name="clock_in"
                                type="datetime-local"
                                defaultValue={toInputFormat(entry.start)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="clock_out">Salida</Label>
                            <Input
                                id="clock_out"
                                name="clock_out"
                                type="datetime-local"
                                defaultValue={toInputFormat(entry.end)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="correction_reason" className="flex items-center gap-1.5">
                            Motivo de la Incidencia/Cambio *
                        </Label>
                        <Textarea
                            id="correction_reason"
                            name="correction_reason"
                            placeholder="Ej. El empleado olvidó marcar la salida al irse ayer..."
                            defaultValue={entry.correction_reason || ''}
                            required
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 text-amber-800 text-xs">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <p>
                            Este cambio será marcado como <strong>"Corrección Manual"</strong> y aparecerá en el listado de incidencias y en los informes legales generados.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="gap-2 bg-[#3b60c1] hover:bg-[#2d4a94] text-white">
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Guardar y Registrar
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

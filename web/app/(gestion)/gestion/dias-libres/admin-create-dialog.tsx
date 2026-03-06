'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { adminCreateTimeOff, getEmployeesForTimeOff } from './actions'
import { useRouter } from 'next/navigation'
import { UserPlus, Loader2, Calendar } from 'lucide-react'
import { toast } from 'sonner'

export function AdminCreateTimeOffDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [employees, setEmployees] = useState<any[]>([])
    const router = useRouter()

    useEffect(() => {
        if (open) {
            getEmployeesForTimeOff().then(setEmployees)
        }
    }, [open])

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        const formData = new FormData(event.currentTarget)
        const res = await adminCreateTimeOff(formData)
        setLoading(false)

        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success('Ausencia creada y notificada al empleado')
            setOpen(false)
            router.refresh()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-12 px-6 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold uppercase tracking-widest text-[10px] backdrop-blur-md border border-white/20 shadow-xl transition-all hover:-translate-y-0.5 group">
                    <UserPlus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform opacity-80" />
                    Asignar Ausencia
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px] rounded-lg border-slate-200 shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight text-left">Programar Ausencia</DialogTitle>
                    </div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> Control Administrativo
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid gap-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Seleccionar Empleado</Label>
                            <Select name="userId" required>
                                <SelectTrigger className="h-12 bg-white border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-blue-500/20 shadow-sm">
                                    <SelectValue placeholder="Busca un empleado..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-slate-100 shadow-xl">
                                    {employees.map((emp) => (
                                        <SelectItem key={emp.id} value={emp.id} className="font-bold">
                                            {emp.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Tipo de Ausencia</Label>
                            <Select name="type" required defaultValue="vacation">
                                <SelectTrigger className="h-12 bg-white border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-blue-500/20 shadow-sm">
                                    <SelectValue placeholder="Tipo de ausencia" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-slate-100 shadow-xl">
                                    <SelectItem value="vacation" className="font-bold">☀️ Vacaciones</SelectItem>
                                    <SelectItem value="personal" className="font-bold">🏠 Asuntos Propios</SelectItem>
                                    <SelectItem value="medical" className="font-bold">🏥 Baja Médica</SelectItem>
                                    <SelectItem value="other" className="font-bold">✨ Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Desde</Label>
                                <Input
                                    type="date"
                                    name="start"
                                    required
                                    className="h-12 bg-white border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-blue-500/20 transition-all shadow-sm"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Hasta</Label>
                                <Input
                                    type="date"
                                    name="end"
                                    required
                                    className="h-12 bg-white border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-blue-500/20 transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Motivo / Nota Interna</Label>
                            <Textarea
                                name="reason"
                                placeholder="Ej. Vacaciones programadas según acuerdo..."
                                className="min-h-[100px] bg-white border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-blue-500/20 shadow-sm resize-none"
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 flex gap-4">
                        <div className="h-10 w-10 shrink-0 bg-white rounded-lg shadow-sm flex items-center justify-center">
                            <Loader2 className="h-5 w-5 text-blue-500 animate-pulse" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Aviso Administrativo</p>
                            <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                                La ausencia se marcará como <strong className="text-slate-900">APROBADA</strong> automáticamente y se notificará por email al empleado.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-black uppercase tracking-widest text-[10px] shadow-xl shadow-slate-200 transition-all hover:-translate-y-0.5"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Crear y Notificar
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

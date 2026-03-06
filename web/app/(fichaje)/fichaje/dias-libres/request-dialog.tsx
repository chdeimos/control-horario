'use client'

import { useState } from 'react'
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
import { requestTimeOff } from './actions'
import { useRouter } from 'next/navigation'
import { Palmtree, Send, X, UserPlus } from 'lucide-react'

interface RequestTimeOffDialogProps {
    vacationBalance: number
    personalBalance: number
    fullWidth?: boolean
}

export function RequestTimeOffDialog({ vacationBalance, personalBalance, fullWidth }: RequestTimeOffDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const res = await requestTimeOff(formData)
        setLoading(false)
        if (res?.error) {
            alert(res.error)
        } else {
            setOpen(false)
            router.refresh()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    className={`w-full py-7 text-[15px] font-bold rounded-lg bg-[#3b60c1] hover:bg-[#2d4a94] shadow-none transition-all active:scale-[0.98] flex gap-2`}
                >
                    <Palmtree size={20} strokeWidth={2} />
                    Solicitar Ausencia
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">Nueva Solicitud</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-3 py-2">
                    <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo de Ausencia</Label>
                        <Select name="type" required defaultValue={vacationBalance > 0 ? "vacation" : personalBalance > 0 ? "personal" : "medical"}>
                            <SelectTrigger className="h-11 rounded-lg font-bold border-slate-200 focus:ring-blue-500 bg-slate-50/50">
                                <SelectValue placeholder="Tipo de ausencia" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                                <SelectItem value="vacation" disabled={vacationBalance <= 0}>
                                    Vacaciones ({vacationBalance} disp.)
                                </SelectItem>
                                <SelectItem value="personal" disabled={personalBalance <= 0}>
                                    Asuntos Propios ({personalBalance} disp.)
                                </SelectItem>
                                <SelectItem value="medical">Baja Médica</SelectItem>
                                <SelectItem value="other">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha Inicio</Label>
                            <Input
                                type="date"
                                name="start"
                                required
                                className="h-11 rounded-lg font-bold border-slate-200 bg-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha Fin</Label>
                            <Input
                                type="date"
                                name="end"
                                required
                                className="h-11 rounded-lg font-bold border-slate-200 bg-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Motivo o Descripción</Label>
                        <Textarea
                            name="reason"
                            className="rounded-lg border-slate-200 min-h-[80px] font-medium p-3 focus:ring-[#3b60c1]"
                            placeholder="Ej: Viaje familiar, cita médica, etc..."
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-[#3b60c1] hover:bg-[#2d4a94] text-white font-black rounded-lg shadow-none transition-all active:scale-95 flex gap-2"
                        >
                            {loading ? 'Procesando...' : (
                                <>
                                    <Send size={18} />
                                    Enviar Solicitud
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

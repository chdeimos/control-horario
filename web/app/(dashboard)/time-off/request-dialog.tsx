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

export function RequestTimeOffDialog({ vacationBalance, personalBalance }: { vacationBalance: number, personalBalance: number }) {
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
                <Button>+ Solicitar Ausencia</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[5px] border-slate-100 shadow-2xl">
                <DialogHeader className="pt-4 px-1">
                    <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Solicitar Ausencia</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit}>
                    <div className="grid gap-6 py-6">
                        <div className="flex flex-col gap-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Tipo de ausencia</Label>
                            <Select name="type" required defaultValue={vacationBalance > 0 ? "vacation" : personalBalance > 0 ? "personal" : "medical"}>
                                <SelectTrigger className="h-12 rounded-[5px] border-slate-200 bg-slate-50/30 focus:ring-blue-500/20 focus:border-blue-500 font-medium">
                                    <SelectValue placeholder="Selecciona el tipo" />
                                </SelectTrigger>
                                <SelectContent className="rounded-[5px] border-slate-100 shadow-xl">
                                    <SelectItem value="vacation" disabled={vacationBalance <= 0}>
                                        <div className="flex flex-col">
                                            <span className="font-bold">Vacaciones</span>
                                            <span className="text-[10px] text-slate-400 capitalize">{vacationBalance} días disponibles</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="personal" disabled={personalBalance <= 0}>
                                        <div className="flex flex-col">
                                            <span className="font-bold">Asuntos Propios</span>
                                            <span className="text-[10px] text-slate-400 capitalize">{personalBalance} días disponibles</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="medical">
                                        <div className="flex flex-col">
                                            <span className="font-bold">Baja Médica</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Fecha inicio</Label>
                            <Input type="date" name="start" required className="h-12 rounded-[5px] border-slate-200 bg-slate-50/30 font-medium" />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Fecha fin</Label>
                            <Input type="date" name="end" required className="h-12 rounded-[5px] border-slate-200 bg-slate-50/30 font-medium" />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Motivo (Opcional)</Label>
                            <Textarea
                                name="reason"
                                className="min-h-[100px] rounded-[5px] border-slate-200 bg-slate-50/30 font-medium resize-none p-4"
                                placeholder="Indica brevemente el motivo de tu ausencia..."
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-2 px-1 pb-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-[5px] font-black uppercase tracking-widest text-[10px] h-12 w-full shadow-lg shadow-blue-900/10 active:scale-[0.98] transition-all"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2 italic">
                                    <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                                    Enviando
                                </span>
                            ) : 'Enviar Solicitud'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}


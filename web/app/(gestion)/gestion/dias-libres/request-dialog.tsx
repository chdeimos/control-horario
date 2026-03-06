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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Solicitar Días Libres</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Tipo</Label>
                        <Select name="type" required defaultValue={vacationBalance > 0 ? "vacation" : personalBalance > 0 ? "personal" : "medical"}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Tipo de ausencia" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="vacation" disabled={vacationBalance <= 0}>
                                    Vacaciones ({vacationBalance} disp.)
                                </SelectItem>
                                <SelectItem value="personal" disabled={personalBalance <= 0}>
                                    Asuntos Propios ({personalBalance} disp.)
                                </SelectItem>
                                <SelectItem value="medical">Baja Médica</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Desde</Label>
                        <Input type="date" name="start" required className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Hasta</Label>
                        <Input type="date" name="end" required className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Motivo</Label>
                        <Textarea name="reason" className="col-span-3" placeholder="Opcional..." />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Enviando...' : 'Enviar Solicitud'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}


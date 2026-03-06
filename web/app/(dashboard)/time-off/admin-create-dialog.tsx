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
                <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/5">
                    <UserPlus className="h-4 w-4" />
                    Asignar Ausencia (Admin)
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Programar Ausencia para Empleado
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Seleccionar Empleado</Label>
                        <Select name="userId" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Busca un empleado..." />
                            </SelectTrigger>
                            <SelectContent>
                                {employees.map((emp) => (
                                    <SelectItem key={emp.id} value={emp.id}>
                                        {emp.full_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Tipo de Ausencia</Label>
                        <Select name="type" required defaultValue="vacation">
                            <SelectTrigger>
                                <SelectValue placeholder="Tipo de ausencia" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="vacation">Vacaciones</SelectItem>
                                <SelectItem value="personal">Asuntos Propios</SelectItem>
                                <SelectItem value="medical">Baja Médica</SelectItem>
                                <SelectItem value="other">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Desde</Label>
                            <Input type="date" name="start" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Hasta</Label>
                            <Input type="date" name="end" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Motivo / Nota Interna</Label>
                        <Textarea
                            name="reason"
                            placeholder="Ej. Vacaciones programadas según acuerdo..."
                            className="min-h-[80px]"
                        />
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-800">
                        <p className="font-semibold mb-1 uppercase tracking-wider">💡 Información para el administrador</p>
                        <ul className="list-disc list-inside space-y-0.5">
                            <li>La ausencia se marcará automáticamente como <strong>APROBADA</strong>.</li>
                            <li>Se enviará un <strong>email de notificación</strong> al empleado en este momento.</li>
                            <li>Aparecerá un aviso destacado en el <strong>Dashboard</strong> del empleado.</li>
                        </ul>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="gap-2">
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Crear y Notificar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

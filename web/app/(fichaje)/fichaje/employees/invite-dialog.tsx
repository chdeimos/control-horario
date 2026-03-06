'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { inviteEmployee } from './actions'
import { Plus } from 'lucide-react'

export function InviteEmployeeDialog({ departments, settings }: { departments: any[], settings?: any }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        const formData = new FormData(event.currentTarget)

        const res = await inviteEmployee(formData)

        setLoading(false)
        if (res.error) {
            alert(res.error)
        } else {
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Agregar Empleado
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Invitar Nuevo Empleado</DialogTitle>
                    <DialogDescription>
                        Se enviará un correo de invitación para que configure su contraseña.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="full_name">Nombre Completo *</Label>
                        <Input id="full_name" name="full_name" required placeholder="Ej. Ana García" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nif">NIF / DNI *</Label>
                            <Input id="nif" name="nif" required placeholder="12345678A" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input id="phone" name="phone" placeholder="600000000" />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="social_security_number">Nº Seguridad Social</Label>
                        <Input id="social_security_number" name="social_security_number" placeholder="28/12345678/90" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Correo Electrónico *</Label>
                            <Input id="email" name="email" type="email" required placeholder="ana@empresa.com" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Rol *</Label>
                            <Select name="role" defaultValue="employee" required>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="employee">Empleado</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="company_admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="department_id">Departamento *</Label>
                            <Select name="department_id" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map((dept: any) => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="scheduled_hours">Horas/Día *</Label>
                            <Input id="scheduled_hours" name="scheduled_hours" type="number" step="0.5" defaultValue="8.0" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                        <div className="grid gap-2">
                            <Label htmlFor="total_vacation_days">Vacaciones (Días)</Label>
                            <Input
                                id="total_vacation_days"
                                name="total_vacation_days"
                                type="number"
                                defaultValue={settings?.default_vacation_days ?? 22}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="total_personal_days">Libre Disp. (Días)</Label>
                            <Input
                                id="total_personal_days"
                                name="total_personal_days"
                                type="number"
                                defaultValue={settings?.default_personal_days ?? 0}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Invitando...' : 'Enviar Invitación'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

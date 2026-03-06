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
                <Button className="h-12 px-6 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold uppercase tracking-widest text-[10px] backdrop-blur-md border border-white/20 shadow-xl transition-all hover:-translate-y-0.5 group">
                    <Plus className="mr-2 h-4 w-4 stroke-[3px] group-hover:scale-110 transition-transform opacity-80" />
                    Agregar Empleado
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] rounded-lg border-slate-200 shadow-2xl p-0 overflow-hidden border-none">
                <DialogHeader className="p-8 bg-slate-50/50 border-b border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-1.5 h-6 bg-[#3b60c1] rounded-full"></div>
                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight text-left">Invitar Empleado</DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-500 font-medium text-left">
                        Se enviará un correo de bienvenida para activar la cuenta.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid gap-2.5">
                        <Label htmlFor="full_name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nombre Completo *</Label>
                        <Input id="full_name" name="full_name" required placeholder="Ej. Ana García" className="h-12 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 focus:border-[#3b60c1] transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="grid gap-2.5">
                            <Label htmlFor="nif" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">NIF / DNI *</Label>
                            <Input id="nif" name="nif" required placeholder="12345678A" className="h-12 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 focus:border-[#3b60c1] transition-all" />
                        </div>
                        <div className="grid gap-2.5">
                            <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Teléfono</Label>
                            <Input id="phone" name="phone" placeholder="600000000" className="h-12 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 focus:border-[#3b60c1] transition-all" />
                        </div>
                    </div>

                    <div className="grid gap-2.5">
                        <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Correo Corporativo *</Label>
                        <Input id="email" name="email" type="email" required placeholder="ana@empresa.com" className="h-12 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 focus:border-[#3b60c1] transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="grid gap-2.5">
                            <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Rol Operativo *</Label>
                            <Select name="role" defaultValue="employee" required>
                                <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 focus:border-[#3b60c1] transition-all">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-slate-100 shadow-xl">
                                    <SelectItem value="employee" className="font-bold">EMPLEADO</SelectItem>
                                    <SelectItem value="manager" className="font-bold">GESTOR</SelectItem>
                                    <SelectItem value="company_admin" className="font-bold">ADMIN DE EMPRESA</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2.5">
                            <Label htmlFor="department_id" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Departamento *</Label>
                            <Select name="department_id" required>
                                <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 focus:border-[#3b60c1] transition-all">
                                    <SelectValue placeholder="Selecciona" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-slate-100 shadow-xl">
                                    {departments.map((dept: any) => (
                                        <SelectItem key={dept.id} value={dept.id} className="font-bold">
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2.5">
                        <Label htmlFor="pin_code" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Código PIN (Acceso Físico)</Label>
                        <Input
                            id="pin_code" name="pin_code"
                            maxLength={4}
                            placeholder="Ej. 1234"
                            className="h-12 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-700 tracking-[0.5em] focus:ring-[#3b60c1]/20 focus:border-[#3b60c1] transition-all"
                        />
                        <p className="text-[9px] font-medium text-slate-400 italic font-medium tracking-tight">Código de 4 cifras para fichar desde el terminal fijo.</p>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <Button type="submit" disabled={loading} className="w-full h-12 rounded-lg bg-[#3b60c1] hover:bg-[#2d4a94] text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-200 transition-all active:scale-95">
                            {loading ? 'Generando Invitación...' : 'Enviar Invitación de Alta'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

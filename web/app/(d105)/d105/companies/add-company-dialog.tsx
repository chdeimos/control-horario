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
import { Plus, Loader2, Building2 } from 'lucide-react'
import { createCompany } from './actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function AddCompanyDialog({ plans }: { plans: any[] }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        const formData = new FormData(event.currentTarget)
        const res = await createCompany(formData)
        setLoading(false)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Nueva instancia corporativa desplegada con éxito')
            setOpen(false)
            router.refresh()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-14 px-10 bg-white hover:bg-slate-50 text-[#3b60c1] rounded-lg font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-slate-200/40 transition-all hover:-translate-y-1 active:scale-95 border-none flex items-center gap-3">
                    <Plus size={16} />
                    Alta de Empresa
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-none rounded-lg shadow-xl shadow-slate-200/40 p-0 overflow-hidden max-w-md animate-in zoom-in-95 duration-300">
                <div className="h-2 bg-[#3b60c1]"></div>

                <DialogHeader className="p-10 pb-0">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-50 text-[#3b60c1] rounded-2xl flex items-center justify-center">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">
                                Inicializar Empresa
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">
                                Despliegue de Instancia de Red
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-10 space-y-10">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Identificador Nominal</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="EJ: ACME GLOBAL CORE"
                                required
                                className="h-14 bg-slate-50 border-slate-100 rounded-lg text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all placeholder:text-slate-300"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="cif" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Cédula Fiscal (CIF/NIF)</Label>
                            <Input
                                id="cif"
                                name="cif"
                                placeholder="A12345678"
                                required
                                className="h-14 bg-slate-50 border-slate-100 rounded-lg text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all placeholder:text-slate-300"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="plan_id" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Protocolo de Asignación</Label>
                            <Select name="plan_id" required>
                                <SelectTrigger className="h-14 bg-slate-50 border-slate-100 rounded-lg text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all">
                                    <SelectValue placeholder="SELECCIONAR NIVEL..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-slate-100 rounded-lg shadow-xl shadow-slate-200/40">
                                    {plans.map((plan) => (
                                        <SelectItem key={plan.id} value={plan.id} className="rounded-lg text-[10px] font-black uppercase tracking-widest focus:bg-[#3b60c1] focus:text-white py-3">
                                            {plan.name.toUpperCase()} / {Math.round(plan.price_per_user)}€ UNIT
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="flex-1 h-14 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] transition-all"
                        >
                            Abortar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] h-14 bg-[#3b60c1] hover:bg-[#2d4a94] text-white rounded-lg font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-blue-200/40 transition-all hover:-translate-y-1 active:scale-95"
                        >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    DESPLEGANDO...
                                </div>
                            ) : 'ACTIVAR EMPRESA'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

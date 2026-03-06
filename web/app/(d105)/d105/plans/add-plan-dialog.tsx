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
import { Plus, Loader2, Zap, Layers, Wallet } from 'lucide-react'
import { createPlan } from './actions'
import { toast } from 'sonner'

export function AddPlanDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [billingType, setBillingType] = useState('per_user')

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        const formData = new FormData(event.currentTarget)
        formData.append('billing_type', billingType)

        const res = await createPlan(formData)
        setLoading(false)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Nueva arquitectura de plan inyectada con éxito')
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-14 px-10 bg-white hover:bg-slate-50 text-[#3b60c1] rounded-lg font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-slate-200/40 transition-all hover:-translate-y-1 active:scale-95 border-none flex items-center gap-3">
                    <Plus size={16} />
                    Configurar Nuevo Plan
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-none rounded-lg shadow-xl shadow-slate-200/40 p-0 overflow-hidden max-w-md animate-in zoom-in-95 duration-300">
                <div className="h-2 bg-[#3b60c1]"></div>

                <DialogHeader className="p-10 pb-0">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-50 text-[#3b60c1] rounded-2xl flex items-center justify-center">
                            <Layers size={24} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">
                                Inicializar Plan
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">
                                Arquitectura de Facturación SaaS
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-10 space-y-10">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Identificador del Plan</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="EJ: PROTOCOLO STANDARD"
                                required
                                className="h-14 bg-slate-50 border-slate-100 rounded-lg text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all placeholder:text-slate-300"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Modelo de Ejecución</Label>
                            <Select value={billingType} onValueChange={setBillingType}>
                                <SelectTrigger className="h-14 bg-slate-50 border-slate-100 rounded-lg text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-slate-100 rounded-lg shadow-xl shadow-slate-200/40">
                                    <SelectItem value="per_user" className="rounded-lg text-[10px] font-black uppercase tracking-widest focus:bg-[#3b60c1] focus:text-white py-3">PAGO POR EMPLEADO</SelectItem>
                                    <SelectItem value="fixed" className="rounded-lg text-[10px] font-black uppercase tracking-widest focus:bg-[#3b60c1] focus:text-white py-3">TARIFA PLANA FIJA</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {billingType === 'per_user' ? (
                            <div className="space-y-3">
                                <Label htmlFor="price_per_user" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Coste por Unidad (€)</Label>
                                <div className="relative group">
                                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#3b60c1] transition-colors" />
                                    <Input
                                        id="price_per_user"
                                        name="price_per_user"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        required
                                        className="h-14 pl-12 bg-slate-50 border-slate-100 rounded-2xl text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <Label htmlFor="fixed_price" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Precio Base (€)</Label>
                                    <Input
                                        id="fixed_price"
                                        name="fixed_price"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        required
                                        className="h-14 bg-slate-50 border-slate-100 rounded-2xl text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="fixed_users_limit" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Límite Unidades</Label>
                                    <Input
                                        id="fixed_users_limit"
                                        name="fixed_users_limit"
                                        type="number"
                                        placeholder="0"
                                        required
                                        className="h-14 bg-slate-50 border-slate-100 rounded-2xl text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {billingType === 'fixed' && (
                            <div className="space-y-3">
                                <Label htmlFor="price_per_user" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Exceso por Unidad (€)</Label>
                                <div className="relative group">
                                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                                    <Input
                                        id="price_per_user"
                                        name="price_per_user"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="h-14 pl-12 bg-slate-50 border-slate-100 rounded-2xl text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-blue-100/50 focus:border-amber-500 transition-all text-amber-600"
                                    />
                                </div>
                            </div>
                        )}
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
                                    ASIGNANDO...
                                </div>
                            ) : 'ESTABLECER PLAN'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

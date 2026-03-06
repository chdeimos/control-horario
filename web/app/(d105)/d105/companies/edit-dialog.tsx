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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Pencil, Loader2, ShieldCheck, ShieldAlert, Settings2, Activity } from 'lucide-react'
import { updateCompany, deleteCompany } from './actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function EditCompanyDialog({ company, plans }: { company: any, plans: any[] }) {
    const [open, setOpen] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        const formData = new FormData(event.currentTarget)
        const res = await updateCompany(company.id, formData)
        setLoading(false)
        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success('Parámetros de nodo actualizados correctamente')
            setOpen(false)
            router.refresh()
        }
    }

    async function handleDelete() {
        setLoading(true)
        const res = await deleteCompany(company.id)
        setLoading(false)

        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success('Instancia purgada del núcleo central')
            setConfirmDelete(false)
            setOpen(false)
            router.refresh()
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:bg-[#3b60c1] hover:text-white hover:border-[#3b60c1] transition-all shadow-sm">
                        <Settings2 size={18} />
                    </Button>
                </DialogTrigger>
                <DialogContent className="bg-white border-none rounded-3xl shadow-2xl p-0 overflow-hidden max-w-md animate-in zoom-in-95 duration-300">
                    <div className="h-2 bg-amber-500"></div>

                    <DialogHeader className="p-10 pb-0">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                                <Activity size={24} />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">
                                    Ajustar Parámetros
                                </DialogTitle>
                                <DialogDescription className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">
                                    Configuración de Nodo: <span className="text-amber-600">{company.name}</span>
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
                                    defaultValue={company.name}
                                    required
                                    className="h-14 bg-slate-50 border-slate-100 rounded-2xl text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="cif" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Cédula Fiscal (CIF/NIF)</Label>
                                <Input
                                    id="cif"
                                    name="cif"
                                    defaultValue={company.cif}
                                    required
                                    className="h-14 bg-slate-50 border-slate-100 rounded-2xl text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="plan_id" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Protocolo de Plan vinculado</Label>
                                <Select name="plan_id" defaultValue={company.plan_id || ''}>
                                    <SelectTrigger className="h-14 bg-slate-50 border-slate-100 rounded-2xl text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all">
                                        <SelectValue placeholder="SELECCIONAR PROTOCOLO..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border border-slate-100 rounded-2xl shadow-2xl">
                                        {plans.map((plan: any) => (
                                            <SelectItem key={plan.id} value={plan.id} className="rounded-xl text-[10px] font-black uppercase tracking-widest focus:bg-[#3b60c1] focus:text-white py-3">
                                                {plan.name.toUpperCase()} / {Math.round(plan.price_per_user)}€ UNIT
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 group/status hover:bg-white transition-all">
                                <Checkbox
                                    id="is_active"
                                    name="is_active"
                                    defaultChecked={company.is_active}
                                    className="h-5 w-5 border-slate-200 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 rounded-lg transition-all"
                                />
                                <Label
                                    htmlFor="is_active"
                                    className="flex-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover/status:text-slate-900 cursor-pointer flex items-center gap-3"
                                >
                                    {company.is_active ? <ShieldCheck size={16} className="text-emerald-500" /> : <ShieldAlert size={16} className="text-rose-500" />}
                                    Estado de Conectividad Activa
                                </Label>
                            </div>
                        </div>

                        <div className="flex flex-row gap-4">
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => setConfirmDelete(true)}
                                disabled={loading}
                                className="h-14 w-14 bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-600 hover:text-white rounded-2xl transition-all shadow-sm"
                            >
                                <Trash2 size={20} />
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 h-14 bg-[#3b60c1] hover:bg-[#2d4a94] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        SINCRONIZANDO...
                                    </div>
                                ) : 'ACTUALIZAR NODO'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                <AlertDialogContent className="bg-white border-none rounded-3xl shadow-2xl p-0 overflow-hidden max-w-md animate-in zoom-in-95 duration-300">
                    <div className="h-2 bg-rose-600"></div>
                    <div className="p-10 space-y-8">
                        <AlertDialogHeader className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                                    <Trash2 size={24} />
                                </div>
                                <AlertDialogTitle className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">
                                    Confirmar Purga
                                </AlertDialogTitle>
                            </div>
                            <AlertDialogDescription className="text-slate-500 text-sm font-bold uppercase tracking-wide leading-relaxed">
                                Estas a punto de <span className="text-rose-600 font-black">ELIMINAR DEFINITIVAMENTE</span> la instancia <span className="text-slate-900 font-extrabold">{company.name}</span> de la red central.
                                <br /><br />
                                Esta operación es irreversible y purgará todos los registros vinculados.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-3">
                            <AlertDialogCancel disabled={loading} className="flex-1 bg-slate-50 border-none text-slate-400 hover:text-slate-900 rounded-2xl h-14 uppercase text-[10px] font-black tracking-widest transition-all">
                                ABORTAR
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault()
                                    handleDelete()
                                }}
                                className="flex-1 rounded-2xl uppercase text-[10px] font-black tracking-widest h-14 transition-all bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-200"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'CONFIRMAR PURGA'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

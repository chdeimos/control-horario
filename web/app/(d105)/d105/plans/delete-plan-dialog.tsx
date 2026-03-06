'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Trash2, AlertTriangle, Loader2, ArrowRight } from 'lucide-react'
import { deletePlan } from './actions'
import { toast } from 'sonner'

interface DeletePlanDialogProps {
    plan: any
    allPlans: any[]
}

export function DeletePlanDialog({ plan, allPlans }: DeletePlanDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [migrationPlanId, setMigrationPlanId] = useState<string>('')
    const [step, setStep] = useState<'confirm' | 'migrate'>('confirm')

    const otherPlans = allPlans.filter(p => p.id !== plan.id)

    async function handleDelete() {
        setLoading(true)
        const res = await deletePlan(plan.id, migrationPlanId)
        setLoading(false)

        if (res?.error === 'DEPENDENCY_REQUIRED') {
            setStep('migrate')
            toast.warning('Imposible purgar: Entidades vinculadas detectadas')
        } else if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success('Protocolo planario purgado correctamente')
            setOpen(false)
            setStep('confirm')
        }
    }

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 text-[#3b60c1] hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm"
                onClick={() => setOpen(true)}
            >
                <Trash2 size={18} />
            </Button>

            <Dialog open={open} onOpenChange={(v) => {
                setOpen(v)
                if (!v) setStep('confirm')
            }}>
                <DialogContent className="bg-white border-none rounded-3xl shadow-2xl p-0 overflow-hidden max-w-md animate-in zoom-in-95 duration-300">
                    <div className="h-2 bg-rose-600"></div>

                    <DialogHeader className="p-10 pb-0">
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${step === 'confirm' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                {step === 'confirm' ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">
                                    {step === 'confirm' ? `Purgar Protocolo` : 'Reasignación Forzosa'}
                                </DialogTitle>
                                <DialogDescription className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">
                                    {step === 'confirm' ? `Eliminación de Plan: ${plan.name}` : `Plan con ${plan.companies_count} dependencias`}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-10 space-y-10">
                        {step === 'confirm' ? (
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide leading-relaxed">
                                Solicitud de eliminación para el plan <span className="text-slate-900 font-extrabold">{plan.name.toUpperCase()}</span>.
                                <br /><br />
                                Esta operación purgará la configuración de la red central.
                            </p>
                        ) : (
                            <div className="space-y-6">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider leading-relaxed">
                                    Se requiere un <span className="text-amber-600 font-black">Plan de Destino</span> para migrar las {plan.companies_count} empresas vinculadas antes de la purga final.
                                </p>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Plan de Migración</label>
                                    <Select value={migrationPlanId} onValueChange={setMigrationPlanId}>
                                        <SelectTrigger className="h-14 bg-slate-50 border-slate-100 rounded-2xl text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all">
                                            <SelectValue placeholder="SELECCIONAR PLAN..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border border-slate-100 rounded-2xl shadow-2xl">
                                            {otherPlans.map(p => (
                                                <SelectItem key={p.id} value={p.id} className="rounded-xl text-[10px] font-black uppercase tracking-widest focus:bg-[#3b60c1] focus:text-white py-3">
                                                    {p.name.toUpperCase()}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-row gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                disabled={loading}
                                className="flex-1 h-14 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all"
                            >
                                Abortar
                            </Button>
                            <Button
                                onClick={handleDelete}
                                disabled={loading || (step === 'migrate' && !migrationPlanId)}
                                className={`flex-[2] h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 ${step === 'confirm' ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'}`}
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    step === 'confirm' ? <Trash2 size={16} /> : <ArrowRight size={16} />
                                )}
                                {step === 'confirm' ? 'Confirmar Purga' : 'Migrar y Purgar'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

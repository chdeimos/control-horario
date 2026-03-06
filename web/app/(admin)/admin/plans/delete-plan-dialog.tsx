'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Trash2 } from 'lucide-react'
import { deletePlan } from './actions'

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
        } else if (res?.error) {
            alert(res.error)
        } else {
            setOpen(false)
            setStep('confirm')
        }
    }

    return (
        <>
            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setOpen(true)}>
                <Trash2 className="h-4 w-4" />
            </Button>

            <Dialog open={open} onOpenChange={(v) => {
                setOpen(v)
                if (!v) setStep('confirm')
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {step === 'confirm' ? `¿Eliminar plan ${plan.name}?` : 'Migración Requerida'}
                        </DialogTitle>
                        <DialogDescription>
                            {step === 'confirm'
                                ? 'Esta acción no se puede deshacer. Si el plan está en uso, se pedirá una migración.'
                                : `Hay ${plan.companies_count} empresas usando este plan. Selecciona un plan al que migrarlas.`}
                        </DialogDescription>
                    </DialogHeader>

                    {step === 'migrate' && (
                        <div className="py-4 space-y-2">
                            <label className="text-sm font-medium">Plan de Destino</label>
                            <Select value={migrationPlanId} onValueChange={setMigrationPlanId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un plan..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {otherPlans.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={loading || (step === 'migrate' && !migrationPlanId)}
                        >
                            {loading ? 'Procesando...' : (step === 'confirm' ? 'Eliminar' : 'Migrar y Eliminar')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

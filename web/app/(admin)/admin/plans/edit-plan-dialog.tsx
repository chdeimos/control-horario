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
    DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit2 } from 'lucide-react'
import { updatePlan } from './actions'

export function EditPlanDialog({ plan }: { plan: any }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [billingType, setBillingType] = useState(plan.billing_type || 'per_user')

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        const formData = new FormData(event.currentTarget)
        formData.append('billing_type', billingType)

        const res = await updatePlan(plan.id, formData)
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
                <Button variant="ghost" size="icon">
                    <Edit2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Plan: {plan.name}</DialogTitle>
                    <DialogDescription>
                        Modifica los parámetros de facturación para este plan.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre del Plan</Label>
                        <Input id="name" name="name" defaultValue={plan.name} required />
                    </div>

                    <div className="grid gap-2">
                        <Label>Modelo de Facturación</Label>
                        <Select value={billingType} onValueChange={setBillingType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="per_user">Pago por Usuario</SelectItem>
                                <SelectItem value="fixed">Tarifa Plana (Precio Fijo)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {billingType === 'per_user' ? (
                        <div className="grid gap-2">
                            <Label htmlFor="price_per_user">Precio por Usuario (€)</Label>
                            <Input id="price_per_user" name="price_per_user" type="number" step="0.01" defaultValue={plan.price_per_user} required />
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="fixed_price">Precio Fijo Mensual (€)</Label>
                                <Input id="fixed_price" name="fixed_price" type="number" step="0.01" defaultValue={plan.fixed_price} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="fixed_users_limit">Límite de Usuarios Activos</Label>
                                <Input id="fixed_users_limit" name="fixed_users_limit" type="number" defaultValue={plan.fixed_users_limit} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="price_per_user">Precio Usuario Extra (€)</Label>
                                <Input id="price_per_user" name="price_per_user" type="number" step="0.01" defaultValue={plan.price_per_user} />
                            </div>
                        </>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

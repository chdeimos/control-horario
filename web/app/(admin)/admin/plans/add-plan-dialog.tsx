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
import { Plus } from 'lucide-react'
import { createPlan } from './actions'

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
            alert(res.error)
        } else {
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Plan
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Plan</DialogTitle>
                    <DialogDescription>
                        Configura el modelo de facturación y límites del nuevo plan.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre del Plan</Label>
                        <Input id="name" name="name" placeholder="Ej: Standard, Pro, Tarifa Plana 25..." required />
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
                            <Input id="price_per_user" name="price_per_user" type="number" step="0.01" placeholder="Ej: 5.00" required />
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="fixed_price">Precio Fijo Mensual (€)</Label>
                                <Input id="fixed_price" name="fixed_price" type="number" step="0.01" placeholder="Ej: 50.00" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="fixed_users_limit">Límite de Usuarios Activos</Label>
                                <Input id="fixed_users_limit" name="fixed_users_limit" type="number" placeholder="Ej: 25" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="price_per_user">Precio Usuario Extra (€) <span className="text-xs text-muted-foreground">(opcional)</span></Label>
                                <Input id="price_per_user" name="price_per_user" type="number" step="0.01" placeholder="Ej: 2.00" />
                            </div>
                        </>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creando...' : 'Crear Plan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

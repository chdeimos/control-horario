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
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Pencil } from 'lucide-react'
import { updateCompany, deleteCompany } from './actions'
import { useRouter } from 'next/navigation'

export function EditCompanyDialog({ company, plans }: { company: any, plans: any[] }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        const formData = new FormData(event.currentTarget)

        // Checkbox handling hack because unchecked checkboxes don't send data
        // We handle it in the server action by checking existence, but here we can ensure it.

        const res = await updateCompany(company.id, formData)

        setLoading(false)
        if (res?.error) {
            alert(res.error)
        } else {
            setOpen(false)
            router.refresh()
        }
    }

    async function handleDelete() {
        if (!confirm('¿Estás seguro de que quieres eliminar esta empresa? Esta acción no se puede deshacer y solo funcionará si no hay usuarios.')) return

        setLoading(true)
        const res = await deleteCompany(company.id)
        setLoading(false)

        if (res?.error) {
            alert(res.error)
        } else {
            setOpen(false)
            router.refresh()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Empresa</DialogTitle>
                    <DialogDescription>
                        Modifica los límites y el estado de la empresa.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre de la Empresa</Label>
                        <Input id="name" name="name" defaultValue={company.name} required />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="cif">CIF</Label>
                        <Input id="cif" name="cif" defaultValue={company.cif} required />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="plan_id">Plan de Suscripción</Label>
                        <Select name="plan_id" defaultValue={company.plan_id || ''}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un plan" />
                            </SelectTrigger>
                            <SelectContent>
                                {plans.map((plan: any) => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                        {plan.name} ({plan.price_per_user}€)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>


                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox id="is_active" name="is_active" defaultChecked={company.is_active} />
                        <Label htmlFor="is_active">Empresa Activa</Label>
                    </div>

                    <DialogFooter className="flex justify-between sm:justify-between">
                        <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

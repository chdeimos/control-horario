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
import { createCompany } from './actions'
import { useRouter } from 'next/navigation'

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
            alert(res.error)
        } else {
            setOpen(false)
            router.refresh()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Empresa
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Empresa</DialogTitle>
                    <DialogDescription>
                        Crea un nuevo tenant en la plataforma.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre de la Empresa</Label>
                        <Input id="name" name="name" placeholder="Ej: Acme Corp" required />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="cif">CIF</Label>
                        <Input id="cif" name="cif" placeholder="Ej: B12345678" required />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="plan_id">Plan inicial</Label>
                        <Select name="plan_id" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un plan" />
                            </SelectTrigger>
                            <SelectContent>
                                {plans.map((plan) => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                        {plan.name} ({plan.price_per_user}€)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>


                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Registrando...' : 'Registrar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

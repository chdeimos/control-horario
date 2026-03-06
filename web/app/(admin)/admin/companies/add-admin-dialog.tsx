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
import { UserPlus } from 'lucide-react'
import { createCompanyAdmin } from './actions'
import { useRouter } from 'next/navigation'

export function AddAdminDialog({ companyId, companyName }: { companyId: string, companyName: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        const formData = new FormData(event.currentTarget)
        const res = await createCompanyAdmin(companyId, formData)
        setLoading(false)
        if (res.error) {
            alert(res.error)
        } else {
            alert('Invitación enviada correctamente al administrador.')
            setOpen(false)
            router.refresh()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Añadir Admin
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Añadir Administrador</DialogTitle>
                    <DialogDescription>
                        Crea un perfil de administrador para <strong>{companyName}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="full_name">Nombre Completo</Label>
                        <Input id="full_name" name="full_name" placeholder="Ej: Juan Pérez" required />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input id="email" name="email" type="email" placeholder="admin@empresa.com" required />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Invitando...' : 'Enviar Invitación'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { updateProfile } from './actions'
import { useRouter } from 'next/navigation'

export function ProfileForm({ profile, userEmail }: { profile: any, userEmail: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const form = event.currentTarget
        setLoading(true)
        const formData = new FormData(form)
        const res = await updateProfile(formData)

        if (res.error) {
            setLoading(false)
            alert(res.error)
            return
        }

        if (res.emailChangePending) {
            // Redirect to verify page for OTP confirmation on OLD email
            const oldEmail = res.oldEmail || ''
            const newEmail = res.newEmail || ''
            router.push(`/verify?email=${encodeURIComponent(oldEmail)}&newEmail=${encodeURIComponent(newEmail)}&type=email_change`)
            return
        }

        setLoading(false)
        alert('Perfil actualizado correctamente')
        // Clear password field
        const passInput = form.querySelector('input[name="password"]') as HTMLInputElement
        if (passInput) passInput.value = ''
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Mi Perfil (Super Admin)</CardTitle>
                <CardDescription>Actualiza tus datos de acceso y nombre público.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            defaultValue={userEmail}
                            required
                        />
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                            Al cambiarlo, recibirás un código de confirmación para validar el cambio.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="full_name">Nombre Completo</Label>
                        <Input
                            id="full_name"
                            name="full_name"
                            defaultValue={profile?.full_name || ''}
                            required
                        />
                    </div>

                    <div className="grid gap-2 pt-2">
                        <Label htmlFor="password">Nueva Contraseña</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Dejar en blanco para no cambiar"
                            minLength={6}
                        />
                        <p className="text-xs text-muted-foreground">Mínimo 6 caracteres.</p>
                    </div>
                </CardContent>
                <CardFooter className="pt-4 border-t">
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Guardando...' : 'Actualizar Perfil'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}

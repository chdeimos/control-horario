import Link from "next/link"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { LoginForm } from "./login-form"

import { createClient } from "@/lib/supabase/server"
import { shouldRequest2FA } from "@/lib/security"

export default async function LoginPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let initialUserId = null
    let force2FA = false

    if (user) {
        const needsChallenge = await shouldRequest2FA(user.id)
        if (needsChallenge) {
            initialUserId = user.id
            force2FA = true
        }
    }

    return (
        <Card>
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">
                    {force2FA ? 'Verificación Requerida' : 'Iniciar Sesión'}
                </CardTitle>
                <CardDescription>
                    {force2FA
                        ? 'Tu sesión requiere una verificación de seguridad adicional.'
                        : 'Introduce tu correo y contraseña para acceder al panel.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <LoginForm initialUserId={initialUserId} force2FA={force2FA} />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <div className="text-xs text-center text-muted-foreground w-full pt-2">
                    ¿Te han invitado?{" "}
                    <Link href="/verify" className="underline underline-offset-4 hover:text-primary font-medium">
                        Introduce tu código aquí
                    </Link>
                </div>
            </CardFooter>
        </Card>
    )
}

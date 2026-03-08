'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn, verify2FALogin } from "./actions"
import { AlertCircle, Loader2, ShieldCheck, KeyRound } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface LoginFormProps {
    initialUserId?: string | null
    force2FA?: boolean
}

export function LoginForm({ initialUserId = null, force2FA = false }: LoginFormProps) {
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [requires2FA, setRequires2FA] = useState(force2FA)
    const [userId, setUserId] = useState<string | null>(initialUserId)
    const [twoFactorToken, setTwoFactorToken] = useState("")

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setLoading(true)

        if (requires2FA && userId) {
            try {
                const result = await verify2FALogin(userId, twoFactorToken)
                if (result?.error) {
                    setError(result.error)
                }
            } catch (e: any) {
                if (e.message !== 'NEXT_REDIRECT') {
                    setError('Error al verificar el código 2FA.')
                }
            } finally {
                setLoading(false)
            }
            return
        }

        const formData = new FormData(event.currentTarget)
        try {
            const result = await signIn(formData)

            if (result?.requires2FA) {
                setRequires2FA(true)
                setUserId(result.userId!)
                setLoading(false)
            } else if (result?.error) {
                setError(result.error)
                setLoading(false)
            }
        } catch (e: any) {
            if (e.message !== 'NEXT_REDIRECT') {
                setError('Ocurrió un error inesperado al intentar iniciar sesión.')
                setLoading(false)
            }
        }
    }

    if (requires2FA) {
        return (
            <div className="grid gap-6">
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600 mb-2">
                        <ShieldCheck className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Verificación en dos pasos</h2>
                    <p className="text-slate-500 text-sm max-w-[280px]">
                        Introduce el código de 6 dígitos que aparece en tu aplicación de autenticación.
                    </p>
                </div>

                <form method="POST" onSubmit={handleSubmit} className="grid gap-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="token" className="sr-only">Código 2FA</Label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                            <Input
                                id="token"
                                type="text"
                                placeholder="000000"
                                maxLength={6}
                                className="pl-10 h-12 text-center text-xl tracking-[0.5em] font-bold"
                                value={twoFactorToken}
                                onChange={(e) => setTwoFactorToken(e.target.value)}
                                required
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                    </div>

                    <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verificar e iniciar sesión'}
                    </Button>

                    {!force2FA && (
                        <button
                            type="button"
                            onClick={() => { setRequires2FA(false); setUserId(null); }}
                            className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            Volver al inicio de sesión
                        </button>
                    )}
                </form>
            </div>
        )
    }

    return (
        <form method="POST" onSubmit={handleSubmit} className="grid gap-4">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@ejemplo.com"
                    required
                    autoComplete="email"
                    disabled={loading}
                />
            </div>
            <div className="grid gap-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                </div>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    disabled={loading}
                />
            </div>

            <Button className="w-full h-11 bg-slate-900" disabled={loading}>
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Iniciando sesión...
                    </>
                ) : (
                    'Entrar'
                )}
            </Button>
        </form>
    )
}

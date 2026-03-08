'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn, verify2FALogin } from "./actions"
import { AlertCircle, Loader2, ShieldCheck, KeyRound, Mail, Lock, ArrowRight, LogIn } from "lucide-react"
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
            <div className="grid gap-8">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 bg-primary rounded-lg text-white flex items-center justify-center shadow-lg shadow-blue-200 animate-bounce-subtle">
                        <ShieldCheck className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Verificación 2FA</h2>
                        <p className="text-slate-500 text-sm">
                            Introduce el código de 6 dígitos.
                        </p>
                    </div>
                </div>

                <form method="POST" onSubmit={handleSubmit} className="grid gap-6">
                    {error && (
                        <Alert variant="destructive" className="rounded-lg border-red-100 bg-red-50 text-red-900 animate-in shake-in-1">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="font-medium text-xs">{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="token" className="sr-only">Código 2FA</Label>
                        <div className="relative group">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input
                                id="token"
                                type="text"
                                placeholder="000 000"
                                maxLength={6}
                                className="pl-12 h-16 text-center text-3xl tracking-[0.3em] font-black bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-primary focus-visible:bg-white transition-all ring-offset-0"
                                value={twoFactorToken}
                                onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, ''))}
                                required
                                disabled={loading}
                                autoFocus
                                inputMode="numeric"
                                pattern="[0-9]*"
                            />
                        </div>
                    </div>

                    <Button className="w-full h-16 bg-primary hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-lg shadow-xl shadow-blue-100 active:scale-[0.98] transition-all group" disabled={loading}>
                        {loading ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <span className="flex items-center gap-2">
                                Verificar ahora
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                        )}
                    </Button>

                    {!force2FA && (
                        <button
                            type="button"
                            onClick={() => { setRequires2FA(false); setUserId(null); }}
                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 transition-colors text-center"
                        >
                            Usar otra cuenta
                        </button>
                    )}
                </form>
            </div>
        )
    }

    return (
        <form method="POST" onSubmit={handleSubmit} className="grid gap-6">
            {error && (
                <Alert variant="destructive" className="rounded-lg border-red-100 bg-red-50 text-red-900 animate-in shake-in-1">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-semibold text-xs">{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Corporativo</Label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="nombre@empresa.com"
                            className="pl-12 h-14 bg-slate-50/50 border-slate-200 rounded-lg focus-visible:ring-primary focus-visible:bg-white transition-all ring-offset-0 font-bold text-sm"
                            required
                            autoComplete="email"
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password" title="Contraseña" className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contraseña</Label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            className="pl-12 h-14 bg-slate-50/50 border-slate-200 rounded-lg focus-visible:ring-primary focus-visible:bg-white transition-all ring-offset-0 font-bold text-sm"
                            required
                            autoComplete="current-password"
                            disabled={loading}
                        />
                    </div>
                </div>
            </div>

            <Button className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest rounded-lg shadow-xl shadow-primary/20 active:scale-[0.98] transition-all group mt-2" disabled={loading}>
                {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                    <span className="flex items-center gap-2">
                        Iniciar Sesión
                        <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                )}
            </Button>
        </form>
    )
}

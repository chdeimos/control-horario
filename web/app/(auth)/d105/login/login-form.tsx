'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signInD105, verify2FALoginD105 } from "./actions"
import { AlertCircle, Loader2, ShieldCheck, KeyRound, Mail, Lock, ArrowRight, LogIn } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LoginFormProps {
    initialUserId?: string | null
    force2FA?: boolean
}

export function D105LoginForm({ initialUserId = null, force2FA = false }: LoginFormProps) {
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
                const result = await verify2FALoginD105(userId, twoFactorToken)
                if (result?.error) {
                    setError(result.error)
                }
            } catch (e: any) {
                if (e.message !== 'NEXT_REDIRECT') {
                    setError('Error al verificar el código 2FA de administrador.')
                }
            } finally {
                setLoading(false)
            }
            return
        }

        const formData = new FormData(event.currentTarget)
        try {
            const result = await signInD105(formData)

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
                setError('Ocurrió un error inesperado de red.')
                setLoading(false)
            }
        }
    }

    if (requires2FA) {
        return (
            <div className="grid gap-8">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 bg-red-600 rounded-lg text-white flex items-center justify-center shadow-lg shadow-red-900/30">
                        <ShieldCheck className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-white tracking-tight">Autorización REQUERIDA</h2>
                        <p className="text-white/40 text-xs">
                            Ingresa código 2FA de operador
                        </p>
                    </div>
                </div>

                <form method="POST" onSubmit={handleSubmit} className="grid gap-6">
                    {error && (
                        <Alert variant="destructive" className="rounded-lg border-red-500 bg-red-950/50 text-red-200">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <AlertDescription className="font-medium text-[10px] tracking-widest uppercase">{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="token" className="sr-only">Código 2FA</Label>
                        <div className="relative group">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 group-focus-within:text-red-500 transition-colors" />
                            <Input
                                id="token"
                                type="text"
                                placeholder="000 000"
                                maxLength={6}
                                className="pl-12 h-16 text-center text-3xl tracking-[0.3em] font-black bg-black border-white/10 rounded-lg focus-visible:ring-red-600 focus-visible:bg-[#111] transition-all ring-offset-0 text-white"
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

                    <Button className="w-full h-16 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest rounded-lg transition-all group border border-red-500/50" disabled={loading}>
                        {loading ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <span className="flex items-center gap-2">
                                REVISAR AUTORIDAD
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                        )}
                    </Button>

                    {!force2FA && (
                        <button
                            type="button"
                            onClick={() => { setRequires2FA(false); setUserId(null); }}
                            className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors text-center"
                        >
                            Cancelar Protocolo
                        </button>
                    )}
                </form>
            </div>
        )
    }

    return (
        <form method="POST" onSubmit={handleSubmit} className="grid gap-6">
            {error && (
                <Alert variant="destructive" className="rounded-lg border-red-500 bg-red-950/50 text-red-200 animate-in fade-in">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="font-semibold text-[10px] uppercase tracking-widest">{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="email" className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] px-1">Credencial Operador</Label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 group-focus-within:text-red-500 transition-colors" />
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="admin@dominio.com"
                            className="pl-12 h-14 bg-black border-white/10 rounded-lg text-white focus-visible:ring-red-600 focus-visible:bg-[#111] transition-all ring-offset-0 font-bold text-xs"
                            required
                            autoComplete="email"
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password" title="Contraseña" className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] px-1">Clave de Seguridad</Label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 group-focus-within:text-red-500 transition-colors" />
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            className="pl-12 h-14 bg-black border-white/10 rounded-lg text-white focus-visible:ring-red-600 focus-visible:bg-[#111] transition-all ring-offset-0 font-bold text-xs"
                            required
                            autoComplete="current-password"
                            disabled={loading}
                        />
                    </div>
                </div>
            </div>

            <Button className="w-full h-14 bg-white hover:bg-slate-200 text-black font-black text-[10px] uppercase tracking-widest rounded-lg shadow-xl active:scale-[0.98] transition-all group mt-2" disabled={loading}>
                {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                    <span className="flex items-center gap-2">
                        Autorizar Acceso
                        <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                )}
            </Button>
        </form>
    )
}

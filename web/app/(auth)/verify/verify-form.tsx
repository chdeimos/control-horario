'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from 'next/navigation'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, CheckCircle2, ShieldCheck, Mail, ArrowRight } from 'lucide-react'
import { finalizeEmailChange } from '@/app/(admin)/admin/settings/actions'
import { verifyUserOtp } from './actions'

interface Branding {
    appName: string;
    logoUrl: string | null;
}

export default function VerifyForm({ branding }: { branding: Branding }) {
    const searchParams = useSearchParams()
    const [email, setEmail] = useState(searchParams.get('email') || '')
    const [token, setToken] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const router = useRouter()

    const { appName, logoUrl } = branding

    // Detect if we are in an email change flow
    const isEmailChangeFlow = !!searchParams.get('newEmail')
    const newEmailToSet = searchParams.get('newEmail')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setLoading(true)

        if (isEmailChangeFlow && newEmailToSet) {
            const cleanToken = token.trim()
            const res = await finalizeEmailChange(newEmailToSet, cleanToken)
            if (res.error) {
                setError(res.error)
                setLoading(false)
                return
            }

            setSuccess(true)
            setTimeout(() => {
                router.push('/admin/settings')
            }, 2000)
            return
        }

        const res = await verifyUserOtp(email, token)

        if (!res.error) {
            setSuccess(true)
            setTimeout(() => {
                router.push('/set-password')
            }, 2000)
            return
        }

        setError('El código no es válido. Asegúrate de copiar los 6 dígitos del último correo recibido.')
        setLoading(false)
    }

    if (success) {
        return (
            <div className="bg-white rounded-lg p-12 border border-blue-50 shadow-2xl shadow-blue-900/5 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-[#3b60c1] rounded-lg text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-200">
                    <CheckCircle2 className="h-10 w-10 animate-in zoom-in-50 duration-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase whitespace-nowrap">¡Correo Verificado!</h2>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-[240px] mx-auto">
                        Tu identidad ha sido confirmada correctamente. Redirigiendo...
                    </p>
                </div>
                <div className="pt-2">
                    <div className="h-1 w-24 bg-slate-100 rounded-full mx-auto overflow-hidden">
                        <div className="h-full bg-[#3b60c1] animate-progress-fast" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
            {/* Branding Section - Dynamic SaaS Logo/Name */}
            <div className="flex flex-col items-center gap-6 mb-2">
                <div className="flex flex-col items-center gap-4">
                    {logoUrl ? (
                        <img src={logoUrl} alt={appName} className="h-14 w-auto object-contain" />
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-[#3b60c1] rounded-lg flex items-center justify-center shadow-xl shadow-blue-900/10 transition-transform hover:scale-105 duration-300">
                                <span className="text-white font-black text-2xl uppercase">{appName.charAt(0)}</span>
                            </div>
                            <span className="text-3xl font-black text-slate-900 leading-none tracking-tighter uppercase italic drop-shadow-sm">{appName}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <div className="h-[1px] w-4 bg-slate-200" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Security Gateway</span>
                        <div className="h-[1px] w-4 bg-slate-200" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg p-8 md:p-12 shadow-2xl shadow-blue-900/5 border border-slate-100">
                <form method="POST" onSubmit={handleSubmit} className="space-y-8">
                    <div className="text-center space-y-2 mb-4">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center justify-center gap-3 uppercase">
                            <ShieldCheck size={24} className="text-[#3b60c1]" />
                            Verificar Acceso
                        </h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Introduce el código de 6 dígitos</p>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="rounded-lg border-red-100 bg-red-50 text-red-900 animate-in shake-in-1 shadow-sm">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="font-bold text-[11px] uppercase tracking-wide">{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-6">
                        <div className="grid gap-3">
                            <Label htmlFor="email" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Tu Correo Electrónico</Label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#3b60c1] transition-colors" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nombre@empresa.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-12 h-14 bg-slate-50 border-slate-100 rounded-lg focus-visible:ring-[#3b60c1]/20 focus-visible:border-[#3b60c1] focus-visible:bg-white transition-all ring-offset-0 font-bold text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-3">
                            <Label htmlFor="token" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Código de Seguridad</Label>
                            <Input
                                id="token"
                                type="text"
                                placeholder="000000"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                maxLength={6}
                                className="h-16 text-center text-3xl tracking-[0.5em] font-black bg-slate-50 border-slate-100 rounded-lg focus-visible:ring-[#3b60c1]/20 focus-visible:border-[#3b60c1] focus-visible:bg-white transition-all ring-offset-0"
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-16 bg-[#3b60c1] hover:bg-[#2d4a94] text-white font-black text-xs uppercase tracking-[0.2em] rounded-lg shadow-xl shadow-blue-900/10 active:scale-[0.98] transition-all group" disabled={loading}>
                        {loading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                        ) : (
                            <span className="flex items-center gap-3">
                                Confirmar Identidad
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform stroke-[3px]" />
                            </span>
                        )}
                    </Button>
                </form>
            </div>

            <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] px-12 leading-relaxed opacity-80">
                ¿No has recibido el código? <br />
                Revisa tu carpeta de spam o contacta con soporte.
            </p>
        </div>
    )
}

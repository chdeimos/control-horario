'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2, Lock, ShieldCheck, Key, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function SetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [checking, setChecking] = useState(true)
    const [companyInfo, setCompanyInfo] = useState<{ name: string, logo: string | null } | null>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                setError('SESSION_NOT_FOUND: Se requiere verificación previa.')
            } else {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('company_id, companies(name, logo_web_url)')
                    .eq('id', session.user.id)
                    .single()

                if (profile) {
                    // @ts-ignore
                    const co = Array.isArray(profile.companies) ? profile.companies[0] : profile.companies
                    setCompanyInfo({
                        name: co?.name || 'ControlPro',
                        logo: co?.logo_web_url || null
                    })
                }
            }
            setChecking(false)
        }
        fetchData()
    }, [supabase])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        if (password.length < 6) {
            setError('La clave debe contener al menos 6 caracteres alfanuméricos.')
            return
        }

        if (password !== confirmPassword) {
            setError('Discrepancia detectada: Las claves no coinciden.')
            return
        }

        setLoading(true)
        const { error: updateError } = await supabase.auth.updateUser({
            password: password
        })

        if (updateError) {
            setError(updateError.message)
            setLoading(false)
        } else {
            toast.success('Credenciales establecidas correctamente')
            router.push('/gestion')
            router.refresh()
        }
    }

    if (checking) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600/20" strokeWidth={3} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando seguridad...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 z-0"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-100/30 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 z-0"></div>

            <div className="w-full max-w-[480px] z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-white rounded-[5px] border border-slate-100 shadow-2xl shadow-slate-900/5 overflow-hidden">
                    <div className="p-10 border-b border-slate-100 bg-slate-50/50">
                        {/* Header with Branding */}
                        <div className="flex flex-col gap-4">
                            {companyInfo?.logo ? (
                                <img src={companyInfo.logo} alt={companyInfo.name} className="h-8 w-fit object-contain" />
                            ) : (
                                <span className="text-xl font-black text-slate-900 tracking-tighter uppercase">{companyInfo?.name || 'ControlPro'}</span>
                            )}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Establecer Credenciales</span>
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 pb-12">
                        {error && (
                            <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-[5px] flex items-start gap-3 animate-in slide-in-from-top-2">
                                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Protocolo de Error</p>
                                    <p className="text-xs font-bold text-rose-500/80 mt-1 leading-relaxed">{error}</p>
                                    {error.includes('sesión') && (
                                        <Button
                                            onClick={() => router.push('/login')}
                                            variant="link"
                                            className="h-auto p-0 text-[10px] font-black text-rose-600 uppercase tracking-widest mt-3 hover:no-underline underline-offset-4"
                                        >
                                            <ArrowRight size={12} className="mr-1" /> Reintentar Autenticación
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        <form method="POST" onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-6">
                                <div className="grid gap-3">
                                    <Label htmlFor="password" className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Nueva Contraseña</Label>
                                    <div className="relative group">
                                        <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="h-12 pl-12 bg-slate-50 border-slate-100 rounded-[5px] text-sm font-bold text-slate-700 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-3">
                                    <Label htmlFor="confirmPassword" className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Introducir de nuevo contraseña</Label>
                                    <div className="relative group">
                                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="h-12 pl-12 bg-slate-50 border-slate-100 rounded-[5px] text-sm font-bold text-slate-700 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-[5px] font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-blue-200 transition-all active:scale-[0.98] group"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Sincronizando...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" />
                                        Guardar Contraseña
                                    </div>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Shield, Smartphone, ArrowRight, Loader2, CheckCircle2, Tablet, Trash2, PowerOff, Power } from 'lucide-react'
import { start2FAActivation, complete2FAActivation, createCompanyKioskToken, toggleKioskStatus, deleteKioskToken } from './actions'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SecurityTabProps {
    profile: any
    kioskData?: any | null
    mode?: 'profile' | 'company'
}

export function SecurityTab({ profile, kioskData, mode = 'profile' }: SecurityTabProps) {
    const router = useRouter()
    const [step, setStep] = useState(profile.two_factor_enabled ? 'enabled' : 'intro')
    const [loading, setLoading] = useState(false)
    const [qrData, setQrData] = useState<{ secret: string, qrCodeUrl: string } | null>(null)
    const [token, setToken] = useState('')
    const [origin, setOrigin] = useState('')

    useEffect(() => {
        setOrigin(window.location.origin)
    }, [])

    async function handleStartActivation() {
        setLoading(true)
        try {
            const data = await start2FAActivation()
            setQrData(data)
            setStep('setup')
        } catch (e) {
            toast.error('Error al generar secreto 2FA')
        } finally {
            setLoading(false)
        }
    }

    async function handleVerifyAndEnable() {
        if (!qrData) return
        setLoading(true)
        try {
            const result = await complete2FAActivation(qrData.secret, token)
            if (result.success) {
                setStep('enabled')
                toast.success('2FA activado correctamente')
                router.refresh()
            } else {
                toast.error('Código incorrecto. Reintenta.')
            }
        } catch (e) {
            toast.error('Error al activar 2FA')
        } finally {
            setLoading(false)
        }
    }

    async function handleToggleStatus() {
        if (!kioskData) return
        setLoading(true)
        const res = await toggleKioskStatus(kioskData.id, kioskData.is_active)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success(kioskData.is_active ? 'Terminal desactivado' : 'Terminal activado')
            router.refresh()
        }
        setLoading(false)
    }

    async function handleDeleteKiosk() {
        if (!confirm('¿Estás seguro de que deseas eliminar este terminal? La URL dejará de funcionar permanentemente.')) return
        setLoading(true)
        const res = await deleteKioskToken()
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Terminal eliminado correctamente')
            router.refresh()
        }
        setLoading(false)
    }

    if (step === 'enabled' && mode === 'profile') {
        return (
            <div className="bg-white rounded-lg border border-green-100 shadow-2xl shadow-green-900/5 overflow-hidden">
                <div className="p-8 border-b border-green-50 bg-green-50/20">
                    <div className="flex items-center gap-3">
                        <div className="h-6 w-1 bg-green-500 rounded-full"></div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Seguridad Máxima</h3>
                    </div>
                </div>
                <div className="p-10 flex flex-col items-center text-center space-y-6">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-lg flex items-center justify-center shadow-inner">
                        <Shield className="h-10 w-10" />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-2xl font-black text-slate-900 tracking-tighter">Protección 2FA Activada</h4>
                        <p className="text-slate-500 font-medium">Tu cuenta cumple con los estándares más altos de seguridad organizacional.</p>
                    </div>
                    <div className="flex items-center gap-3 px-6 py-3 bg-green-50 text-green-700 rounded-lg border border-green-100 text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle2 className="h-4 w-4" />
                        Autenticación Multifactor Habilitada
                    </div>
                </div>
            </div>
        )
    }

    if (step === 'setup' && qrData && mode === 'profile') {
        return (
            <div className="max-w-xl mx-auto bg-white rounded-lg border border-slate-100 shadow-2xl shadow-slate-900/5 overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 text-center">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Sincronizar Dispositivo</h3>
                    <p className="text-[10px] font-black text-[#3b60c1] uppercase tracking-widest mt-1">Configuración de seguridad TOTP</p>
                </div>
                <div className="p-10 space-y-10 flex flex-col items-center">
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-[#3b60c1]/5 blur-xl group-hover:bg-[#3b60c1]/10 transition-all rounded-full"></div>
                        <div className="bg-white p-6 rounded-lg border-4 border-slate-50 shadow-xl relative z-10">
                            <img src={qrData.qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                        </div>
                    </div>

                    <div className="w-full space-y-8">
                        <div className="p-6 bg-slate-50 rounded-lg border border-slate-100 text-center relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#3b60c1]"></div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Clave de respaldo manual</p>
                            <code className="text-[#3b60c1] font-mono font-bold break-all text-sm selection:bg-blue-100">{qrData.secret}</code>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Código de verificación (6 dígitos)</Label>
                            <Input
                                placeholder="000000"
                                className="h-16 text-center text-4xl font-mono tracking-[0.5em] bg-white border-slate-200 rounded-lg text-slate-900 focus:ring-[#3b60c1]/20 transition-all shadow-sm"
                                maxLength={6}
                                value={token}
                                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                            />
                        </div>

                        <div className="flex flex-col gap-4">
                            <Button
                                className="h-12 bg-[#3b60c1] hover:bg-[#2d4a94] text-white rounded-lg font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-blue-200 transition-all hover:-translate-y-0.5"
                                onClick={handleVerifyAndEnable}
                                disabled={loading || token.length < 6}
                            >
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Confirmar y Activar'}
                            </Button>
                            <Button
                                variant="ghost"
                                className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                                onClick={() => setStep('intro')}
                            >
                                Volver
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-12">
            {/* 2FA Section - Only in Profile Mode */}
            {mode === 'profile' && (
                <div className="bg-white rounded-lg border border-slate-100 shadow-2xl shadow-slate-900/5 overflow-hidden">
                    <div className="grid md:grid-cols-2">
                        <div className="p-12 space-y-8">
                            <div className="w-14 h-14 bg-blue-50 text-[#3b60c1] rounded-lg flex items-center justify-center shadow-inner">
                                <Smartphone className="h-7 w-7" />
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-1 bg-[#3b60c1] rounded-full"></div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Seguridad 2FA</h3>
                                </div>
                                <p className="text-slate-500 font-medium text-lg leading-relaxed">
                                    Blindaje corporativo mediante autenticación de doble factor. Protege el acceso administrativo y los datos sensibles de la empresa.
                                </p>
                            </div>

                            <div className="space-y-4 pt-4">
                                {[
                                    'Cumplimiento con normativas RGPD/GDPR',
                                    'Integración con Google Authenticator / Authy',
                                    'Prevención proactiva contra accesos no autorizados'
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 text-slate-600 font-bold text-xs uppercase tracking-tight">
                                        <div className="h-1.5 w-1.5 bg-[#3b60c1] rounded-full"></div>
                                        {item}
                                    </div>
                                ))}
                            </div>

                            <div className="pt-8">
                                <Button
                                    onClick={handleStartActivation}
                                    disabled={loading}
                                    className="h-12 px-10 bg-[#3b60c1] hover:bg-[#2d4a94] text-white rounded-lg font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3 group"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin h-5 w-5" />
                                    ) : (
                                        <>
                                            Activar Blindaje
                                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className="bg-slate-50 border-l border-slate-100 flex items-center justify-center p-16 relative overflow-hidden min-h-[400px]">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#3b60c1]/5 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#3b60c1]/5 blur-[100px] -ml-32 -mb-32 rounded-full"></div>
                            <div className="relative">
                                <Shield className="h-56 w-56 text-slate-100 relative z-10" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Shield className="h-24 w-24 text-blue-100/30 blur-sm" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Terminal Kiosko Section - Only in Company Mode */}
            {mode === 'company' && (
                <>
                    {kioskData ? (
                        <div className="bg-white rounded-lg border border-slate-100 shadow-2xl shadow-slate-900/5 overflow-hidden group hover:border-blue-100 transition-all">
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-1 bg-cyan-500 rounded-full"></div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Terminal de Fichaje Fijo (Kiosko)</h3>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 ${kioskData.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'} rounded-full`}></div>
                                        <span className={`text-[10px] font-black ${kioskData.is_active ? 'text-emerald-600' : 'text-slate-400'} uppercase tracking-widest`}>
                                            {kioskData.is_active ? 'Servicio Activo' : 'Desactivado'}
                                        </span>
                                    </div>

                                    <div className="h-4 w-px bg-slate-200"></div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleToggleStatus}
                                            disabled={loading}
                                            className={`h-8 px-3 rounded-md transition-all flex items-center gap-2 ${kioskData.is_active ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                        >
                                            {kioskData.is_active ? (
                                                <><PowerOff size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Pausar</span></>
                                            ) : (
                                                <><Power size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Reanudar</span></>
                                            )}
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleDeleteKiosk}
                                            disabled={loading}
                                            className="h-8 px-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all flex items-center gap-2"
                                        >
                                            <Trash2 size={14} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Eliminar</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-10 grid md:grid-cols-3 gap-12 items-center">
                                <div className="md:col-span-2 space-y-6">
                                    <div className={`space-y-4 ${!kioskData.is_active && 'opacity-40 grayscale group-hover:opacity-60 transition-all'}`}>
                                        <h4 className="text-xl font-black text-slate-900 tracking-tight">Acceso Directo para Tablet</h4>
                                        <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-xl">
                                            Utiliza esta URL única en el navegador de tu Tablet corporativa. Este enlace permite el fichaje rápido por PIN sin requerir credenciales de administrador en el dispositivo.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className={`flex-1 bg-slate-50 border border-slate-100 p-4 rounded-lg font-mono text-[#3b60c1] font-bold text-sm selection:bg-blue-100 truncate ${!kioskData.is_active && 'opacity-40'}`}>
                                            {origin}/fichaje-fijo/{kioskData.api_key}
                                        </div>
                                        <Button
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${origin}/fichaje-fijo/${kioskData.api_key}`)
                                                toast.success('URL copiada al portapapeles')
                                            }}
                                            disabled={!kioskData.is_active}
                                            className="h-12 px-8 bg-[#3b60c1] hover:bg-[#2d4a94] text-white rounded-lg font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-blue-200 active:scale-95 transition-all hover:-translate-y-0.5 disabled:opacity-30 disabled:hover:translate-y-0"
                                        >
                                            Copiar Enlace
                                        </Button>
                                    </div>
                                </div>
                                <div className="hidden md:flex flex-col items-center justify-center p-8 bg-cyan-50/30 border border-cyan-100 rounded-lg space-y-4">
                                    <Shield className={`h-12 w-12 ${kioskData.is_active ? 'text-cyan-500/30' : 'text-slate-300'}`} />
                                    <p className="text-center text-[9px] font-black text-cyan-700 uppercase tracking-widest leading-relaxed">
                                        {kioskData.is_active
                                            ? "Terminal seguro vinculado única y exclusivamente a tu empresa."
                                            : "Terminal pausado temporalmente. La URL no aceptará registros hasta ser reactivada."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg border border-slate-100 shadow-2xl shadow-slate-900/5 overflow-hidden group hover:border-blue-100 transition-all">
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-1 bg-slate-300 rounded-full"></div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Terminal de Fichaje Fijo</h3>
                                </div>
                            </div>
                            <div className="p-10 flex flex-col items-center text-center space-y-8">
                                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
                                    <Tablet className="h-8 w-8" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-xl font-black text-slate-900 tracking-tight">Activar Sistema de Tablet</h4>
                                    <p className="text-slate-500 font-medium text-sm max-w-md">
                                        Habilita un punto de fichaje centralizado para tus instalaciones. Generaremos una URL segura para tu empresa.
                                    </p>
                                </div>
                                <Button
                                    onClick={async () => {
                                        setLoading(true)
                                        const res = await createCompanyKioskToken()
                                        if (res.error) {
                                            toast.error(res.error)
                                        } else if (res.data) {
                                            toast.success('Sistema de Terminal activado')
                                            router.refresh()
                                        }
                                        setLoading(false)
                                    }}
                                    disabled={loading}
                                    className="h-12 px-10 bg-[#3b60c1] hover:bg-[#2d4a94] text-white rounded-lg font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 shadow-2xl shadow-blue-200 hover:-translate-y-0.5"
                                >
                                    {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Activar Terminal Ahora'}
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

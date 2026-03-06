'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Shield, Smartphone, ArrowRight, Loader2, CheckCircle2, ShieldCheck, Key, Sparkles } from 'lucide-react'
import { startPersonal2FA, completePersonal2FA } from './actions'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PersonalSecurityProps {
    profile: any
}

export function PersonalSecurity({ profile }: PersonalSecurityProps) {
    const [step, setStep] = useState(profile.two_factor_enabled ? 'enabled' : 'intro')
    const [loading, setLoading] = useState(false)
    const [qrData, setQrData] = useState<{ secret: string, qrCodeUrl: string } | null>(null)
    const [token, setToken] = useState('')

    async function handleStartActivation() {
        setLoading(true)
        try {
            const data = await startPersonal2FA()
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
            const result = await completePersonal2FA(qrData.secret, token)
            if (result.success) {
                setStep('enabled')
                toast.success('2FA activado correctamente')
            } else {
                toast.error('Código incorrecto. Reintenta.')
            }
        } catch (e) {
            toast.error('Error al activar 2FA')
        } finally {
            setLoading(false)
        }
    }

    if (step === 'enabled') {
        return (
            <div className="bg-white rounded-lg border border-emerald-100 shadow-xl shadow-emerald-100/30 p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <ShieldCheck size={120} className="text-emerald-500" />
                </div>
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="w-20 h-20 bg-emerald-500 text-white flex items-center justify-center rounded-lg shadow-xl shadow-emerald-200/40">
                        <CheckCircle2 size={40} />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Protocolo 2FA <span className="text-emerald-500 underline decoration-4 underline-offset-8">Activado</span></h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">Integridad de sesión garantizada</p>
                    </div>

                </div>
            </div>
        )
    }

    if (step === 'setup' && qrData) {
        return (
            <div className="bg-white rounded-lg border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden group">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-[#3b60c1]">
                            <Key size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Sincronizar Autenticador</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Escaneo de semilla criptográfica RSA</p>
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-12 flex flex-col items-center">
                    <div className="bg-white p-6 rounded-3xl border-2 border-[#3b60c1]/10 shadow-[0_20px_50px_rgba(59,96,193,0.1)] group-hover:scale-105 transition-transform duration-500">
                        <img src={qrData.qrCodeUrl} alt="QR Code" className="w-48 h-48 mix-blend-multiply" />
                    </div>

                    <div className="w-full max-w-md space-y-10">
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center relative group/key">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 bg-[#3b60c1] text-[8px] font-black text-white rounded-full uppercase tracking-widest py-1 shadow-lg">Respaldo_Manual</div>
                            <code className="text-slate-600 font-mono text-sm break-all font-black tracking-[0.2em] leading-relaxed">
                                {qrData.secret}
                            </code>
                        </div>

                        <div className="space-y-4">
                            <Label htmlFor="token" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center block">Validar Token de Sincronización</Label>
                            <Input
                                id="token"
                                placeholder="000 000"
                                className="h-20 text-center text-5xl font-mono tracking-[0.5em] bg-white border-2 border-slate-100 rounded-lg focus:border-[#3b60c1] focus:ring-4 focus:ring-blue-100/50 text-slate-900 placeholder:text-slate-100 transition-all font-black"
                                maxLength={6}
                                value={token}
                                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                            />
                        </div>

                        <Button
                            className="w-full h-16 bg-[#3b60c1] hover:bg-[#2d4a94] text-white font-black uppercase tracking-[0.3em] rounded-lg transition-all shadow-xl shadow-blue-200/40 active:scale-95 group"
                            onClick={handleVerifyAndEnable}
                            disabled={loading || token.length < 6}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (
                                <div className="flex items-center gap-4">
                                    <span>CONFIRMAR VINCULACIÓN</span>
                                    <ShieldCheck size={20} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden group p-2">
            <div className="bg-slate-50/50 rounded-lg p-10 flex flex-col md:flex-row items-center gap-10">
                <div className="w-24 h-24 bg-white border border-slate-100 flex items-center justify-center text-[#3b60c1] shrink-0 rounded-lg shadow-lg relative overflow-hidden group-hover:-translate-y-2 transition-transform duration-500">
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-[#3b60c1]/20"></div>
                    <Smartphone size={40} className="opacity-40" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Protección de Cuenta Supervisora</h3>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center justify-center md:justify-start gap-2">
                        <Shield size={12} className="text-[#3b60c1]" />
                        Implementar factor de autenticación dual (2FA)
                    </p>
                    <p className="text-sm text-slate-500 font-bold leading-relaxed mt-6 max-w-xl italic uppercase opacity-60">
                        "Como Superadministrador, su identidad es el nodo crítico del sistema. El despliegue de 2FA garantiza la integridad total de la red."
                    </p>
                </div>
                <Button
                    onClick={handleStartActivation}
                    disabled={loading}
                    className="h-16 px-10 bg-white border border-slate-200 text-slate-900 hover:bg-[#3b60c1] hover:text-white hover:border-[#3b60c1] font-black uppercase tracking-[0.2em] rounded-lg transition-all flex gap-4 group shadow-xl shadow-slate-200/40 active:scale-95"
                >
                    {loading ? <Loader2 className="animate-spin" /> : (
                        <>
                            INICIAR PROTOCOLO
                            <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}

'use client'

import { ShieldAlert, Clock, Save, Loader2, KeyRound, Sparkles, ShieldCheck } from "lucide-react"
import { useState } from "react"
import { updateSecuritySettings } from "../actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface SecurityTabProps {
    currentTtl: string
}

export function SecurityTab({ currentTtl }: SecurityTabProps) {
    const [loading, setLoading] = useState(false)
    const [hours, setHours] = useState(currentTtl)

    async function handleSave() {
        setLoading(true)
        try {
            const result = await updateSecuritySettings(hours)
            if (result.success) {
                toast.success('Política de seguridad actualizada')
            } else {
                toast.error('Error: ' + result.error)
            }
        } catch (e) {
            toast.error('Ocurrió un error inesperado')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-lg border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden group max-w-4xl">
            {/* Header section with Amber accent */}
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center text-amber-500">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Seguridad de Acceso Global</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configuracion de intervalos de validacion de seguridad</p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full">
                    <KeyRound size={12} className="text-amber-500" />
                    <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest leading-none">Politica de Acceso Activa</span>
                </div>
            </div>

            <div className="p-10 space-y-12">
                <div className="flex flex-col md:flex-row items-center justify-between p-10 bg-slate-50/50 border border-slate-100 rounded-lg group/item hover:border-[#3b60c1]/30 transition-all gap-8">
                    <div className="flex items-center gap-6 flex-1">
                        <div className="w-16 h-16 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover/item:text-[#3b60c1] group-hover/item:rotate-12 transition-all shadow-sm">
                            <Clock size={32} />
                        </div>
                        <div>
                            <p className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">TTL de Sesión 2FA</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest leading-relaxed">Ventana de tiempo obligatoria entre re-validaciones de token RSA corporativo.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 w-full md:w-auto">
                        <div className="relative group/input flex-1 md:flex-none">
                            <input
                                type="number"
                                value={hours}
                                onChange={(e) => setHours(e.target.value)}
                                className="w-full md:w-32 h-16 bg-white border-2 border-slate-100 rounded-lg text-center font-mono font-black text-2xl text-[#3b60c1] focus:border-[#3b60c1] focus:ring-4 focus:ring-blue-100/50 outline-none transition-all"
                            />
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 bg-slate-100 text-[8px] font-black text-slate-400 uppercase rounded-full">Horas</div>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            className="w-16 h-16 bg-[#3b60c1] hover:bg-[#2d4a94] text-white flex items-center justify-center transition-all shadow-xl shadow-blue-200/40 active:scale-95 rounded-lg"
                        >
                            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save size={24} />}
                        </Button>
                    </div>
                </div>

                <div className="p-8 border-l-4 border-amber-500 bg-amber-50 rounded-r-lg relative overflow-hidden group/warning">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover/warning:scale-110 transition-transform">
                        <ShieldCheck size={100} className="text-amber-600" />
                    </div>
                    <div className="flex gap-4 relative z-10">
                        <Sparkles className="h-5 w-5 text-amber-500 shrink-0" />
                        <p className="text-[11px] text-amber-700/70 font-black uppercase leading-loose tracking-[0.1em] max-w-3xl">
                            * Advertencia de Sistema: La modificación de este parámetro invalida el caché de sesiones en el próximo ciclo de inicio. Todos los operadores deberán re-validar su token una vez expirada la ventana de <span className="text-amber-600 font-extrabold">{hours} horas</span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

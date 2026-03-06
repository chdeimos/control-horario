'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateProfile } from './actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UserCircle, KeyRound, Mail, Loader2, ShieldCheck } from 'lucide-react'

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
            toast.error(`Protocol Error: ${res.error}`)
            return
        }

        if (res.emailChangePending) {
            toast.info('Validación de canal requerida. Redirigiendo...')
            router.push(`/verify?email=${encodeURIComponent(res.oldEmail || '')}&newEmail=${encodeURIComponent(res.newEmail || '')}&type=email_change`)
            return
        }

        setLoading(false)
        toast.success('Identidad Root sincronizada correctamente')

        // Clear password field
        const passInput = form.querySelector('input[name="password"]') as HTMLInputElement
        if (passInput) passInput.value = ''
    }

    return (
        <div className="bg-white rounded-lg border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden group">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-[#3b60c1]">
                        <UserCircle size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Identidad Admin</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configuración de credenciales de acceso D105</p>
                    </div>
                </div>
                {profile.two_factor_enabled ? (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Protocolo 2fa Activado</span>
                    </div>
                ) : (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full">
                        <ShieldCheck size={12} className="text-rose-500" />
                        <span className="text-[8px] font-black text-rose-600 uppercase tracking-widest">2FA desactivado</span>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Mail size={14} className="text-[#3b60c1]" />
                            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Usuario</Label>
                        </div>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            defaultValue={userEmail}
                            required
                            className="bg-slate-50 border-slate-100 rounded-lg h-14 focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all font-bold text-sm text-slate-900"
                        />
                        <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest leading-relaxed">
                            * El cambio de canal requiere validación mediante token seguro enviado a ambas direcciones.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <UserCircle size={14} className="text-[#3b60c1]" />
                            <Label htmlFor="full_name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Nombre</Label>
                        </div>
                        <Input
                            id="full_name"
                            name="full_name"
                            defaultValue={profile?.full_name || ''}
                            required
                            className="bg-slate-50 border-slate-100 rounded-lg h-14 focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all font-bold text-sm text-slate-900"
                        />
                    </div>

                    <div className="space-y-3 md:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                            <KeyRound size={14} className="text-[#3b60c1]" />
                            <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Cambiar Clave</Label>
                        </div>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="OPERACIÓN_LATENTE (DEJAR VACÍO SI NO HAY CAMBIOS)"
                            minLength={6}
                            className="bg-slate-50 border-slate-100 rounded-lg h-14 focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all font-bold text-sm text-slate-900 placeholder:text-slate-300"
                        />
                        <div className="flex items-center gap-2 mt-2">
                            <div className="h-1 w-12 bg-slate-100 rounded-full"></div>
                            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Complejidad mínima requerida: 06 caracteres.</p>
                        </div>
                    </div>
                </div>

                <div className="pt-10 border-t border-slate-50 flex justify-end">
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-[#3b60c1] hover:bg-[#2d4a94] text-white rounded-lg h-16 px-12 text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-blue-200/40 active:scale-95 group"
                    >
                        {loading ? (
                            <div className="flex items-center gap-4">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>SINCRONIZANDO...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <span>ACTUALIZAR</span>
                                <ShieldCheck size={18} className="group-hover:rotate-12 transition-transform" />
                            </div>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}

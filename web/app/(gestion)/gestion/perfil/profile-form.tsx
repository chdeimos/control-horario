'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateProfile } from './actions'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

export function ProfileForm({ profile }: { profile: any }) {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const res = await updateProfile(formData)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Perfil actualizado correctamente')
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nombre Completo</Label>
                    <Input
                        name="full_name"
                        defaultValue={profile.full_name || ""}
                        placeholder="Ej: Juan Pérez"
                        className="h-14 bg-white border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 transition-all shadow-sm"
                        required
                    />
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Teléfono</Label>
                    <Input
                        name="phone"
                        defaultValue={profile.phone || ""}
                        placeholder="Ej: +34 600 000 000"
                        className="h-14 bg-white border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 transition-all shadow-sm"
                    />
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Correo Electrónico (Solo Lectura)</Label>
                    <Input
                        value={profile.email || ""}
                        readOnly
                        className="h-14 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-400 cursor-not-allowed italic"
                    />
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Departamento</Label>
                    <Input
                        value={profile.departments?.name || 'Distribución'}
                        readOnly
                        className="h-14 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-400 cursor-not-allowed italic"
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 px-10 bg-[#3b60c1] hover:bg-[#2d4a94] text-white rounded-lg font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-blue-200 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-3"
                >
                    {loading ? (
                        <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                        <>
                            <Save size={18} />
                            Guardar Cambios
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}

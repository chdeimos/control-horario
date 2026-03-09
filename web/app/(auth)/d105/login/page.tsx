import Link from "next/link"
import { D105LoginForm } from "./login-form"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { shouldRequest2FA } from "@/lib/security"
import { Mail, ShieldAlert } from "lucide-react"
import { redirect } from 'next/navigation'

export default async function D105LoginPage() {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    let initialUserId = null
    let force2FA = false

    if (user) {
        const needsChallenge = await shouldRequest2FA(user.id)
        if (needsChallenge) {
            initialUserId = user.id
            force2FA = true
        } else {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
            if (profile?.role === 'super_admin') {
                redirect('/d105')
            }
        }
    }

    // Fetch SaaS Branding using Admin Client to bypass RLS
    const { data: settingsData } = await adminSupabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['app_name', 'saas_logo_web'])

    const settings = (settingsData || []).reduce((acc: any, item: any) => {
        acc[item.key] = item.value
        return acc
    }, {})

    const appName = settings.app_name || 'ControlPro'
    const logoUrl = settings.saas_logo_web

    return (
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
            {/* Branding Section - Dynamic SaaS Logo/Name */}
            <div className="flex flex-col items-center gap-6 mb-2">
                <div className="flex flex-col items-center gap-4">
                    {logoUrl ? (
                        <img src={logoUrl} alt={appName} className="h-14 w-auto object-contain drop-shadow-md grayscale opacity-90" />
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-black rounded-[5px] flex items-center justify-center shadow-lg shadow-black/20 border border-white/10">
                                <span className="text-white font-black text-xl uppercase">{appName.charAt(0)}</span>
                            </div>
                            <span className="text-2xl font-black text-slate-900 leading-none tracking-tighter uppercase italic">{appName}</span>
                        </div>
                    )}
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-red-600 mt-1 flex items-center gap-2">
                        <ShieldAlert size={14} /> Acceso Restringido
                    </span>
                </div>
            </div>

            {/* Login Frame - D105 Special Variant */}
            <div className="bg-[#0a0a0c] rounded-[5px] p-8 md:p-10 shadow-2xl shadow-black/30 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-red-600/10 to-transparent pointer-events-none"></div>
                <div className="relative z-10">
                    <h2 className="text-center text-white font-medium text-sm mb-6 uppercase tracking-widest text-white/50">Centro de Operaciones</h2>
                    <D105LoginForm initialUserId={initialUserId} force2FA={force2FA} />
                </div>
            </div>

            {/* Actions & Support */}
            <div className="space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200"></span>
                    </div>
                </div>

                <p className="text-center text-[11px] text-slate-400 font-semibold px-4 leading-relaxed">
                    Si no eres administrador técnico de esta instalación SaaS, por favor dirígete al <Link href="/login" className="text-blue-600 underline underline-offset-4">Portal de Empleados</Link>.
                </p>
            </div>
        </div>
    )
}

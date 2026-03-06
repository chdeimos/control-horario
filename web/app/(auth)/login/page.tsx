import Link from "next/link"
import { LoginForm } from "./login-form"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { shouldRequest2FA } from "@/lib/security"
import { Mail } from "lucide-react"

export default async function LoginPage() {
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
                        <img src={logoUrl} alt={appName} className="h-14 w-auto object-contain" />
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-600 rounded-[5px] flex items-center justify-center shadow-lg shadow-blue-900/10">
                                <span className="text-white font-black text-xl uppercase">{appName.charAt(0)}</span>
                            </div>
                            <span className="text-2xl font-black text-slate-900 leading-none tracking-tighter uppercase italic">{appName}</span>
                        </div>
                    )}
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Plataforma Horaria</span>
                </div>
            </div>

            {/* Login Frame - Clean & Sharp */}
            <div className="bg-white rounded-[5px] p-8 md:p-10 shadow-2xl shadow-blue-900/5 border border-slate-100">
                <LoginForm initialUserId={initialUserId} force2FA={force2FA} />
            </div>

            {/* Actions & Support */}
            <div className="space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-100"></span>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-black">
                        <span className="bg-slate-50 px-4 text-slate-400">Sistema de verificación</span>
                    </div>
                </div>

                <div className="text-center">
                    <Link href="/verify" className="inline-flex items-center gap-2 text-xs font-black text-blue-600 hover:bg-blue-50 transition-all py-3 px-6 rounded-[5px] border border-blue-100 bg-white shadow-sm active:scale-95 duration-200 uppercase tracking-widest">
                        <Mail size={14} />
                        Activar con código
                    </Link>
                </div>

                <p className="text-center text-[11px] text-slate-400 font-semibold px-12 leading-relaxed">
                    ¿Problemas de acceso? Contacta con el equipo de soporte IT de tu organización.
                </p>
            </div>
        </div>
    )
}


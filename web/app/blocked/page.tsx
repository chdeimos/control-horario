import { LogoutButton } from '@/components/features/logout-button'
import { createClient } from '@/lib/supabase/server'
import { ShieldAlert } from 'lucide-react'

export default async function BlockedPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Para obtener el nombre de la empresa si es posible
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_active, companies(name, is_active)')
        .eq('id', user?.id)
        .single()

    // Obtener configuración global para el nombre de la plataforma desde Supabase
    const { data: settingsData, error: settingsError } = await supabase
        .from('system_settings')
        .select('key, value')

    if (settingsError) {
        console.error('Error fetching system settings:', settingsError)
    }

    const settings = (settingsData || []).reduce((acc: any, item: any) => {
        acc[item.key] = item.value
        return acc
    }, {})

    // Fallback prioritario: settings.app_name -> 'ControlPro' (Default Brand)
    const platformName = settings.app_name || 'ControlPro'

    const company = Array.isArray(profile?.companies) ? profile?.companies[0] : profile?.companies
    const isCompanyBlocked = company && !company.is_active
    const isUserBlocked = profile && !profile.is_active

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
            <div className="text-center p-12 bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full">
                <div className={`w-20 h-20 ${isCompanyBlocked ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'} rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse`}>
                    <ShieldAlert size={40} />
                </div>

                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">
                    {isCompanyBlocked ? 'Servicio Interrumpido' : 'Acceso Restringido'}
                </h1>

                <div className="space-y-4">
                    {isCompanyBlocked ? (
                        <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest leading-relaxed">
                            El acceso de la empresa <span className="text-slate-900">"{company.name}"</span> ha sido desactivado globalmente por la administración central.
                            <br /><br />
                            Por favor, contacta con el departamento de facturación o administración de {platformName} para reactivar el servicio.
                        </p>
                    ) : isUserBlocked ? (
                        <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest leading-relaxed">
                            Tu cuenta individual ha sido suspendida temporalmente por seguridad o por decisión de tu empresa.
                            <br /><br />
                            Contacta con tu responsable directo o con el administrador de recursos humanos de tu empresa.
                        </p>
                    ) : (
                        <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest leading-relaxed">
                            No tienes permisos activos para acceder a este recurso en este momento.
                        </p>
                    )}
                </div>

                <div className="mt-12 flex flex-col gap-4">
                    <LogoutButton variant="outline" className="rounded-2xl font-black text-[10px] uppercase tracking-widest h-14 px-10 w-full shadow-sm hover:bg-slate-50 transition-all" />
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Referencia de Seguridad: {platformName}</p>
                </div>
            </div>
        </div>
    )
}

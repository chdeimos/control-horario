import { RegistryView } from './registry-view'
import { getDepartments } from '../actions'
import { createClient } from '@/lib/supabase/server'

export default async function RegistryPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Obtener perfil para determinar permisos
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single()

    const isAdmin = ['company_admin', 'super_admin', 'manager'].includes(profile?.role || '')
    const departments = isAdmin ? await getDepartments() : []

    return (
        <div className="animate-in fade-in duration-700 space-y-8 md:-m-8">
            {/* PandoraSoft Style Header Header */}
            <header className="bg-[#3b60c1] pt-16 pb-24 px-10 relative overflow-hidden mb-8">
                {/* Abstract Background Detail */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-5 w-1 bg-white rounded-full"></div>
                        <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.4em]">Control de Presencia Laboral</p>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase italic leading-none">
                                Registro de<br /><span className="text-blue-200">Jornada</span>
                            </h2>
                            <p className="text-blue-100/60 mt-4 text-[10px] font-bold uppercase tracking-widest max-w-lg leading-relaxed">
                                Control en tiempo real de la presencia laboral, auditoría de jornadas y cumplimiento normativo de la plantilla.
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-10 pb-12">
                <RegistryView departments={departments as any} isAdmin={isAdmin} />
            </div>
        </div>
    )
}

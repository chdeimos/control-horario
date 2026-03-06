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
        <div className="animate-in fade-in duration-700 min-h-screen bg-[#f3f4f9] md:-m-12">
            {/* PandoraSoft Style Header Header */}
            <header className="bg-[#3b60c1] pt-16 pb-24 px-10 relative overflow-hidden">
                {/* Abstract Background Detail */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
                                Registro Jornada
                            </h2>
                            <p className="text-blue-100/80 text-base font-medium max-w-lg">
                                Control exhaustivo de presencia laboral, auditoría de jornadas y cumplimiento normativo en tiempo real para toda la organización.
                            </p>
                        </div>

                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-10 -mt-12 relative z-20 space-y-12 pb-20">

                <RegistryView departments={departments} isAdmin={isAdmin} />
            </div>
        </div>
    )
}

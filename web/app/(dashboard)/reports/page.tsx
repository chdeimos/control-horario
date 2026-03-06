import { createClient } from '@/lib/supabase/server'
import { ReportGenerator } from './report-generator'
import { getDepartments } from '../actions'

export default async function ReportsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase.from('profiles').select('role, company_id, department_id').eq('id', user!.id).single()
    const isAdmin = ['company_admin', 'manager', 'super_admin'].includes(profile?.role || '')

    let employees: any[] = []
    let departments: any[] = []

    if (isAdmin && profile) {
        let query = supabase
            .from('profiles')
            .select('id, full_name, department_id')
            .eq('company_id', profile.company_id)

        // If manager, filter by their OWN department
        if (profile.role === 'manager' && profile.department_id) {
            query = query.eq('department_id', profile.department_id)
        }

        const { data } = await query.order('full_name')
        employees = data || []

        // Fetch departments for the filter
        departments = await getDepartments()
    } else {
        // Only self
        const { data } = await supabase.from('profiles').select('id, full_name').eq('id', user!.id).single()
        employees = data ? [data] : []
    }

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
                        <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.4em]">Analítica y Cumplimiento Normativo</p>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase italic leading-none">
                                Centro de<br /><span className="text-blue-200">Informes</span>
                            </h2>
                            <p className="text-blue-100/60 mt-4 text-[10px] font-bold uppercase tracking-widest max-w-lg leading-relaxed">
                                Generación de analítica avanzada, reportes de cumplimiento legal y exportación de registros oficiales de jornada.
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-10 pb-12">
                <ReportGenerator
                    employees={employees}
                    departments={departments}
                    currentUserId={user!.id}
                    isAdmin={isAdmin}
                />
            </div>
        </div>
    )
}

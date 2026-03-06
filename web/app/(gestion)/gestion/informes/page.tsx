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
                                Informes
                            </h2>
                            <p className="text-blue-100/80 text-base font-medium max-w-lg">
                                Generación de analítica avanzada, reportes de cumplimiento legal y exportación de registros de jornada para auditoría de recursos humanos.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
                            <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.5)]"></div>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Data Sync Ready</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-10 -mt-12 relative z-20 space-y-12 pb-20">

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

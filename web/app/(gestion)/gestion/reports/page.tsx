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
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Informes Legales</h2>
                <p className="text-muted-foreground">Genera el registros de jornada mensual obligatorio.</p>
            </div>

            <ReportGenerator
                employees={employees}
                departments={departments}
                currentUserId={user!.id}
                isAdmin={isAdmin}
            />
        </div>
    )
}

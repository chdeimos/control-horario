import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { InviteEmployeeDialog } from './invite-dialog'
import { EmployeeList } from './employee-list'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage({
    searchParams: searchParamsPromise,
}: {
    searchParams: Promise<{ search?: string; department?: string; page?: string; pageSize?: string }>
}) {
    const searchParams = await searchParamsPromise
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    const isAdmin = ['company_admin', 'manager', 'super_admin'].includes(profile?.role)

    if (!isAdmin) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-red-600">Acceso No Autorizado</h2>
                <p>Solo los administradores pueden ver esta sección.</p>
            </div>
        )
    }

    const page = parseInt(searchParams.page || '1')
    const pageSize = searchParams.pageSize === 'all' ? 10000 : parseInt(searchParams.pageSize || '25')
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const adminSupabase = createAdminClient()
    const { data: usersData, error: authError } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })
    const authUsers = usersData?.users || []

    if (authError) {
        console.error('Error fetching auth users:', authError)
    }

    // Build the query
    let employeesQuery = supabase
        .from('profiles')
        .select('*, departments:department_id(name)', { count: 'exact' })
        .eq('company_id', profile?.company_id)
        .order('full_name')

    // Role filtering
    if (profile?.role === 'manager' && profile?.department_id) {
        employeesQuery = employeesQuery.eq('department_id', profile.department_id)
    }

    // Search filter
    if (searchParams.search) {
        employeesQuery = employeesQuery.ilike('full_name', `%${searchParams.search}%`)
    }

    // Department filter
    if (searchParams.department) {
        employeesQuery = employeesQuery.eq('department_id', searchParams.department)
    }

    // Pagination
    if (searchParams.pageSize !== 'all') {
        employeesQuery = employeesQuery.range(from, to)
    }

    const { data: dbProfiles, count, error: dbError } = await employeesQuery

    if (dbError) {
        console.error('Error fetching profiles:', dbError)
        return (
            <div className="p-8 text-center bg-white rounded-lg border border-red-200">
                <h2 className="text-xl font-bold text-red-600">Error de Base de Datos</h2>
                <p className="text-muted-foreground">{dbError.message}</p>
            </div>
        )
    }

    const { data: departments } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', profile?.company_id)
        .order('name')

    const { data: company } = await supabase
        .from('companies')
        .select('settings')
        .eq('id', profile?.company_id)
        .single()

    // Merge
    const employees = (dbProfiles || []).map((p: any) => {
        const authUser = authUsers?.find((u: any) => u.id === p.id)
        return {
            ...p,
            email: authUser?.email || 'No email'
        }
    })

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Empleados</h2>
                    <p className="text-muted-foreground">Gestiona la plantilla de tu empresa.</p>
                </div>
                <InviteEmployeeDialog departments={departments || []} settings={company?.settings || {}} />
            </div>

            <EmployeeList
                employees={employees}
                departments={departments || []}
                totalCount={count || 0}
                isAdmin={profile.role !== 'manager'}
            />
        </div>
    )
}

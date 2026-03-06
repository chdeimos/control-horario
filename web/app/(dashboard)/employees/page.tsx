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
    const { data: { users: authUsers } } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })

    // Build the query
    let employeesQuery = supabase
        .from('profiles')
        .select('*, departments(name)', { count: 'exact' })
        .eq('company_id', profile.company_id)
        .order('full_name')

    // Role filtering
    if (profile.role === 'manager' && profile.department_id) {
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

    const { data: dbProfiles, count } = await employeesQuery

    const { data: departments } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name')

    const { data: company } = await supabase
        .from('companies')
        .select('settings')
        .eq('id', profile.company_id)
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
        <div className="animate-in fade-in duration-700 space-y-8 md:-m-8">
            {/* PandoraSoft Style Header Header */}
            <header className="bg-[#3b60c1] pt-16 pb-24 px-10 relative overflow-hidden mb-8">
                {/* Abstract Background Detail */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-5 w-1 bg-white rounded-full"></div>
                        <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.4em]">Directorio de Capital Humano</p>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase italic leading-none">
                                Lista de<br /><span className="text-blue-200">Empleados</span>
                            </h2>
                            <p className="text-blue-100/60 mt-4 text-[10px] font-bold uppercase tracking-widest max-w-lg leading-relaxed">
                                Gestión integral de la plantilla, roles corporativos y control de acceso por departamento.
                            </p>
                        </div>
                        <InviteEmployeeDialog departments={departments || []} settings={company?.settings || {}} />
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-10 pb-12">

                <EmployeeList
                    employees={employees}
                    departments={departments || []}
                    totalCount={count || 0}
                    isAdmin={profile.role !== 'manager'}
                />
            </div>
        </div>
    )
}

import { TimeEntriesTable } from './entries-table'
import { createClient } from '@/lib/supabase/server'
import { startOfDay, endOfDay, format } from 'date-fns'
import { getDepartments } from '../actions'
import { Clock } from 'lucide-react'

export default async function TimeEntriesPage({
    searchParams: searchParamsPromise,
}: {
    searchParams: Promise<{ search?: string; from?: string; to?: string; page?: string; pageSize?: string; department?: string }>
}) {
    const searchParams = await searchParamsPromise
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>No autenticado</div>

    // Obtener perfil para determinar permisos
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, company_id, department_id, full_name')
        .eq('id', user.id)
        .single()

    if (!profile) return <div>Perfil no encontrado</div>

    const isAdmin = ['company_admin', 'manager', 'super_admin'].includes(profile.role)
    const departments: any[] = [] // Deshabilitado para la vista personal del usuario

    let query = supabase
        .from('time_entries')
        .select(`
            *,
            is_incident,
            incident_reason,
            profiles!inner (
                full_name, 
                department_id,
                schedule_type,
                departments:department_id (name)
            )
        `, { count: 'exact' })
        .eq('user_id', user.id) // Siempre filtrar por el usuario actual
        .order('clock_in', { ascending: false })

    // Default to today's date if no filter is provided
    const today = format(new Date(), 'yyyy-MM-dd')
    const from = searchParams.from || today
    const to = searchParams.to || today

    if (from) {
        query = query.gte('clock_in', startOfDay(new Date(from)).toISOString())
    }
    if (to) {
        query = query.lte('clock_in', endOfDay(new Date(to)).toISOString())
    }

    if (searchParams.search) {
        query = query.ilike('profiles.full_name', `%${searchParams.search}%`)
    }

    query = query.or(`incident_reason.is.null,incident_reason.neq."Incidencia: Fichaje realizado en día sin horario asignado"`)

    const { data: entries, error, count } = await query

    // Get schedules to show daily targets
    const { data: workSchedules } = await supabase
        .from('work_schedules')
        .select('*')
        .eq('profile_id', user.id)

    if (error) {
        return (
            <div className="p-8 text-center bg-white rounded-lg border border-red-100 shadow-xl shadow-red-900/5">
                <h2 className="text-xl font-black text-red-600 mb-2">Error cargando fichajes</h2>
                <p className="text-slate-500 font-medium">{error.message}</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] md:-m-12">
            {/* PandoraSoft Full-Width Blue Banner */}
            <div className="bg-[#3b60c1] pt-16 pb-24 px-10 text-white">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold tracking-tight mb-2">
                        Mis Fichajes
                    </h2>
                    <p className="text-blue-100/80 text-base font-medium">
                        Hola {profile.full_name.split(' ')[0].toLowerCase()}, aquí tienes el detalle de tus jornadas laborales.
                    </p>
                </div>
            </div>

            {/* Content Area overlapping slightly or starting below */}
            <div className="max-w-7xl mx-auto px-10 -mt-12 space-y-8 pb-10">
                <TimeEntriesTable
                    initialEntries={entries || []}
                    isAdmin={false}
                    totalCount={count || 0}
                    departments={departments}
                    workSchedules={workSchedules || []}
                />
            </div>
        </div>
    )
}


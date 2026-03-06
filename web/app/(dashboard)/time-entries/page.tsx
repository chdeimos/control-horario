import { TimeEntriesTable } from './entries-table'
import { createClient } from '@/lib/supabase/server'
import { startOfDay, endOfDay } from 'date-fns'
import { getDepartments } from '../actions'

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
        .select('role, company_id, department_id')
        .eq('id', user.id)
        .single()

    if (!profile) return <div>Perfil no encontrado</div>

    const isAdmin = ['company_admin', 'manager', 'super_admin'].includes(profile.role)
    const departments = isAdmin ? await getDepartments() : []

    const page = parseInt(searchParams.page || '1')
    const pageSize = searchParams.pageSize === 'all' ? 10000 : parseInt(searchParams.pageSize || '25')
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Usamos profiles!inner para filtrar por nombre en el servidor si es necesario
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
        .eq('company_id', profile.company_id)
        .order('clock_in', { ascending: false })

    // Si no es admin, solo sus propios registros
    if (!isAdmin) {
        query = query.eq('user_id', user.id)
    }

    // Filtro por departamento si es manager
    if (profile.role === 'manager') {
        query = query.eq('profiles.department_id', profile.department_id)
    } else if (searchParams.department) {
        query = query.eq('profiles.department_id', searchParams.department)
    }

    // Filtros de fecha
    if (searchParams.from) {
        query = query.gte('clock_in', startOfDay(new Date(searchParams.from)).toISOString())
    }
    if (searchParams.to) {
        query = query.lte('clock_in', endOfDay(new Date(searchParams.to)).toISOString())
    }

    // Filtro de búsqueda por nombre (SERVER SIDE)
    if (searchParams.search) {
        query = query.ilike('profiles.full_name', `%${searchParams.search}%`)
    }

    // Paginación
    if (searchParams.pageSize !== 'all') {
        query = query.range(from, to)
    }

    // Filtrar fuera de horario (los que no deben listarse según el requerimiento)
    // Usamos la razón específica que pusimos en el script y en las acciones
    query = query.or(`incident_reason.is.null,incident_reason.neq."Incidencia: Fichaje realizado en día sin horario asignado"`)

    const { data: entries, error, count } = await query

    if (error) {
        console.error(error)
        return (
            <div className="p-8 text-center bg-white rounded-lg border border-red-200">
                <h2 className="text-xl font-bold text-red-600">Error cargando fichajes</h2>
                <p className="text-muted-foreground">{error.message}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {isAdmin ? 'Histórico de Fichajes' : 'Mis Fichajes'}
                    </h2>
                    <p className="text-muted-foreground">
                        {isAdmin ? 'Administración y búsqueda de registros de jornada.' : 'Historial de tus entradas y salidas.'}
                    </p>
                </div>
            </div>

            <TimeEntriesTable
                initialEntries={entries || []}
                isAdmin={isAdmin}
                totalCount={count || 0}
                departments={departments}
            />
        </div>
    )
}

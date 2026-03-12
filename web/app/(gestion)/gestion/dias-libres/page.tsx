import { createClient } from '@/lib/supabase/server'
import { AdminCreateTimeOffDialog } from './admin-create-dialog'
import { AdminRequestsList } from './admin-list'

export const dynamic = 'force-dynamic'

// Helper to count days (simple diff, no holidays yet)
function getDaysDiff(start: string, end: string) {
    const d1 = new Date(start)
    const d2 = new Date(end)
    const diffTime = Math.abs(d2.getTime() - d1.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

export default async function TimeOffPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams
    const initialStatus = params.status as string | undefined

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase.from('profiles').select('role, company_id, department_id').eq('id', user!.id).single()
    const isAdmin = ['company_admin', 'manager'].includes(profile?.role)

    // Gestión de todas las solicitudes (si soy admin)
    let allRequests: any[] = []

    if (isAdmin && profile) {
        // Fetch requests. If manager, only for their department.
        let query = supabase
            .from('time_off_requests')
            .select('*, profiles(full_name, total_vacation_days, total_personal_days, department_id)')
            .eq('company_id', profile.company_id)

        if (profile.role === 'manager' && profile.department_id) {
            query = query.eq('profiles.department_id', profile.department_id)
        }

        const { data, error } = await query.order('created_at', { ascending: false })
        
        if (error) {
            console.error("Error fetching time_off_requests:", error)
        }
        const rawRequests = data || []
        console.log(`[DEBUG] Solicitudes recuperadas para empresa ${profile.company_id}: ${rawRequests.length}`)

        // Calculate used days per user (split by type)
        const userUsage: Record<string, { vacation: number, personal: number }> = {}

        rawRequests.forEach((req: any) => {
            if (req.status === 'approved') {
                const days = getDaysDiff(req.start_date, req.end_date)
                if (!userUsage[req.user_id]) userUsage[req.user_id] = { vacation: 0, personal: 0 }

                if (req.request_type === 'vacation') userUsage[req.user_id].vacation += days
                if (req.request_type === 'personal') userUsage[req.user_id].personal += days
            }
        })

        // Enhance requests with balance info
        allRequests = rawRequests.map((req: any) => {
            const totalVac = req.profiles?.total_vacation_days ?? 22
            const totalPers = req.profiles?.total_personal_days ?? 0

            const usedVac = userUsage[req.user_id]?.vacation || 0
            const usedPers = userUsage[req.user_id]?.personal || 0

            return {
                ...req,
                balances: {
                    vacation: { total: totalVac, used: usedVac, remaining: totalVac - usedVac },
                    personal: { total: totalPers, used: usedPers, remaining: totalPers - usedPers }
                }
            }
        })

        // Default Sort: Pending first, then Oldest created_at
        allRequests.sort((a, b) => {
            if (a.status === 'pending' && b.status !== 'pending') return -1
            if (a.status !== 'pending' && b.status === 'pending') return 1
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
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
                                Ausencias
                            </h2>
                            <p className="text-blue-100/80 text-base font-medium max-w-lg">
                                Gestión integral de vacaciones, permisos y bajas laborales con sistema de aprobación jerárquica y control de saldos temporales.
                            </p>
                        </div>
                        {isAdmin && (
                            <div className="shrink-0">
                                <AdminCreateTimeOffDialog />
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-10 -mt-12 relative z-20 space-y-12 pb-20">

                <div className="bg-white rounded-lg border border-slate-100 shadow-xl shadow-slate-900/5 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-1 bg-amber-500 rounded-full"></div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Solicitudes del Equipo</h3>
                        </div>
                    </div>

                    <div className="p-0">
                        {isAdmin ? (
                            <AdminRequestsList
                                requests={allRequests}
                                initialStatus={initialStatus}
                            />
                        ) : (
                            <div className="p-12 text-center text-slate-400 font-medium">
                                No tienes permisos para gestionar solicitudes.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

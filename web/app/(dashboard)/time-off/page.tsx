import { createClient } from '@/lib/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHead as CustomTableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RequestTimeOffDialog } from './request-dialog'
import { AdminCreateTimeOffDialog } from './admin-create-dialog'
import { AdminRequestsList } from './admin-list'
import { MyRequestsTable } from './my-requests-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Palmtree, User, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

// Helper to count days (simple diff, no holidays yet)
function getDaysDiff(start: string, end: string) {
    const d1 = new Date(start)
    const d2 = new Date(end)
    const diffTime = Math.abs(d2.getTime() - d1.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

export default async function TimeOffPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase.from('profiles').select('role, company_id, total_vacation_days, total_personal_days, department_id').eq('id', user!.id).single()
    const isAdmin = ['company_admin', 'manager'].includes(profile?.role)

    // 1. Mis solicitudes
    const { data: myRequestsData, error: myRequestsError } = await supabase
        .from('time_off_requests')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

    if (myRequestsError) console.error("Error fetching my requests:", myRequestsError)
    const myRequests = myRequestsData || []

    // 2. Gestión de todas las solicitudes (si soy admin)
    let allRequests: any[] = []

    if (isAdmin && profile) {
        // Fetch requests. If manager, only for their department.
        let query = supabase
            .from('time_off_requests')
            .select('*, profiles!inner(full_name, total_vacation_days, total_personal_days, department_id)')
            .eq('company_id', profile.company_id)

        if (profile.role === 'manager' && profile.department_id) {
            query = query.eq('profiles.department_id', profile.department_id)
        }

        const { data } = await query.order('created_at', { ascending: false })

        const rawRequests = data || []

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

    // 3. Calculate MY Balance
    const totalVacation = profile?.total_vacation_days ?? 22
    const totalPersonal = profile?.total_personal_days ?? 0

    let usedVacation = 0
    let usedPersonal = 0

    myRequests.forEach((req: any) => {
        if (req.status === 'approved') {
            const days = getDaysDiff(req.start_date, req.end_date)
            if (req.request_type === 'vacation') usedVacation += days
            if (req.request_type === 'personal') usedPersonal += days
        }
    })

    const remainingVacation = totalVacation - usedVacation
    const remainingPersonal = totalPersonal - usedPersonal

    return (
        <div className="animate-in fade-in duration-700 space-y-8 md:-m-8">
            {/* PandoraSoft Style Header Header */}
            <header className="bg-[#3b60c1] pt-16 pb-0 px-10 relative overflow-hidden mb-8">
                {/* Abstract Background Detail */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-5 w-1 bg-white rounded-full"></div>
                        <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.4em]">Gestión de Calendario Laboral</p>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
                        <div>
                            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase italic leading-none">
                                Ausencias y<br /><span className="text-blue-200">Vacaciones</span>
                            </h2>
                            <p className="text-blue-100/60 mt-4 text-[10px] font-bold uppercase tracking-widest max-w-lg leading-relaxed">
                                Gestión integral de días libres, permisos legales y seguimiento de saldos de vacaciones para toda la plantilla.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            {isAdmin && <AdminCreateTimeOffDialog />}
                            <RequestTimeOffDialog
                                vacationBalance={remainingVacation}
                                personalBalance={remainingPersonal}
                            />
                        </div>
                    </div>

                    <Tabs defaultValue={isAdmin ? "team" : "personal"} className="w-full">
                        <TabsList className="bg-transparent border-b border-white/20 h-auto p-0 w-full justify-start gap-10 rounded-none overflow-x-auto no-scrollbar">
                            {isAdmin && (
                                <TabsTrigger
                                    value="team"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-blue-100/60 text-[11px] font-black uppercase tracking-[0.2em] px-0 py-4 transition-all hover:text-white flex items-center gap-3"
                                >
                                    <Users size={16} />
                                    Gestión de Equipo
                                </TabsTrigger>
                            )}
                            <TabsTrigger
                                value="personal"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-blue-100/60 text-[11px] font-black uppercase tracking-[0.2em] px-0 py-4 transition-all hover:text-white flex items-center gap-3"
                            >
                                <User size={16} />
                                Mis Solicitudes
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-10 pb-12 space-y-12">
                {/* Balance Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-[5px] border border-blue-50 bg-white shadow-xl shadow-blue-900/5 p-6 flex flex-col justify-between transition-all hover:shadow-2xl">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vacaciones Disponibles</span>
                            <div className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums italic">
                                {remainingVacation} <span className="text-sm font-bold text-slate-400 normal-case tracking-normal">/ {totalVacation} días</span>
                            </div>
                        </div>
                        <div className="w-full bg-slate-50 h-2 mt-6 rounded-full overflow-hidden">
                            <div className="bg-[#3b60c1] h-full" style={{ width: `${Math.min(100, (remainingVacation / totalVacation) * 100)}%` }} />
                        </div>
                    </div>

                    <div className="rounded-[5px] border border-blue-50 bg-white shadow-xl shadow-blue-900/5 p-6 flex flex-col justify-between transition-all hover:shadow-2xl">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asuntos Propios</span>
                            <div className={`text-3xl font-black tracking-tighter tabular-nums italic ${remainingPersonal <= 0 ? 'text-red-600' : 'text-slate-900'}`}>
                                {remainingPersonal} <span className="text-sm font-bold text-slate-400 normal-case tracking-normal">/ {totalPersonal} días</span>
                            </div>
                        </div>
                        <div className="w-full bg-slate-50 h-2 mt-6 rounded-full overflow-hidden">
                            <div className="bg-blue-400 h-full" style={{ width: `${totalPersonal > 0 ? Math.min(100, (remainingPersonal / totalPersonal) * 100) : 0}%` }} />
                        </div>
                    </div>
                </div>

                <Tabs defaultValue={isAdmin ? "team" : "personal"} className="w-full">
                    {isAdmin && (
                        <TabsContent value="team" className="mt-0 focus-visible:outline-none">
                            <div className="bg-white rounded-[5px] border border-blue-50 shadow-xl shadow-blue-900/5 overflow-hidden">
                                <AdminRequestsList requests={allRequests} />
                            </div>
                        </TabsContent>
                    )}

                    <TabsContent value="personal" className="mt-0 focus-visible:outline-none">
                        <div className="bg-white rounded-[5px] border border-blue-50 shadow-xl shadow-blue-900/5 overflow-hidden">
                            <MyRequestsTable requests={myRequests} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

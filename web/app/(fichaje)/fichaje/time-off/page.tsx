import { createClient } from '@/lib/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RequestTimeOffDialog } from './request-dialog'
import { AdminCreateTimeOffDialog } from './admin-create-dialog'
import { AdminRequestsList } from './admin-list'
import { MyRequestsTable } from './my-requests-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

        // Calculate used days per user
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
            const totalPers = req.profiles?.total_personal_days ?? 0 // Pending migration check

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
    // Default values if null (migration might set them, but safe fallback)
    const totalVacation = profile?.total_vacation_days ?? 22 // Standard
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
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Ausencias y Vacaciones</h2>
                    <p className="text-muted-foreground">Gestiona tus días libres.</p>
                </div>
                <div className="flex gap-2">
                    {isAdmin && <AdminCreateTimeOffDialog />}
                    <RequestTimeOffDialog
                        vacationBalance={remainingVacation}
                        personalBalance={remainingPersonal}
                    />
                </div>
            </div>

            {/* Balance Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow space-y-0 p-6 flex flex-col justify-between">
                    <div className="space-y-1">
                        <span className="text-sm font-medium text-muted-foreground">Vacaciones Disponibles</span>
                        <div className="text-2xl font-bold">
                            {remainingVacation} <span className="text-sm font-normal text-muted-foreground">/ {totalVacation} días</span>
                        </div>
                    </div>
                    <div className="w-full bg-secondary h-2 mt-4 rounded-full overflow-hidden">
                        <div className="bg-[#3b60c1] h-full" style={{ width: `${Math.min(100, (remainingVacation / totalVacation) * 100)}%` }} />
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow space-y-0 p-6 flex flex-col justify-between">
                    <div className="space-y-1">
                        <span className="text-sm font-medium text-muted-foreground">Asuntos Propios</span>
                        <div className={`text-2xl font-bold ${remainingPersonal <= 0 ? 'text-red-600' : ''}`}>
                            {remainingPersonal} <span className="text-sm font-normal text-muted-foreground">/ {totalPersonal} días</span>
                        </div>
                    </div>
                    <div className="w-full bg-secondary h-2 mt-4 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${totalPersonal > 0 ? Math.min(100, (remainingPersonal / totalPersonal) * 100) : 0}%` }} />
                    </div>
                </div>
            </div>

            <Tabs defaultValue={isAdmin ? "team" : "personal"} className="w-full">
                <TabsList>
                    {isAdmin && <TabsTrigger value="team">Gestión de Equipo</TabsTrigger>}
                    <TabsTrigger value="personal">Mis Solicitudes</TabsTrigger>
                </TabsList>

                {isAdmin && (
                    <TabsContent value="team">
                        <div className="mt-4">
                            <AdminRequestsList requests={allRequests} />
                        </div>
                    </TabsContent>
                )}

                <TabsContent value="personal">
                    <div className="mt-4">
                        <MyRequestsTable requests={myRequests} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )

}

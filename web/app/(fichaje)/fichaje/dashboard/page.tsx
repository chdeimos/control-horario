import { TimeTracker } from "@/components/features/time-tracker"
import { DashboardStats } from "@/components/features/dashboard-stats"
import { createClient } from '@/lib/supabase/server'

// @force-rebuild
export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()

    const isSuperOrCompanyAdmin = ['super_admin', 'company_admin'].includes(profile?.role)

    // Fetch upcoming approved time off (starting in the next 7 days or currently active)
    const today = new Date().toISOString().split('T')[0]
    const nextWeek = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data: upcomingTimeOff } = await supabase
        .from('time_off_requests')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'approved')
        .or(`start_date.lte.${nextWeek},end_date.gte.${today}`)
        .filter('end_date', 'gte', today)
        .order('start_date', { ascending: true })
        .limit(1)
        .single()

    return (
        <div className="space-y-8">
            {upcomingTimeOff && (
                <div className="bg-blue-700 text-white p-5 rounded-2xl shadow-xl flex items-center gap-5 animate-pulse border-2 border-white/20">
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                        <span className="text-3xl text-white font-bold">📅</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Próxima Ausencia Programada</h3>
                        <p className="opacity-90 text-sm">
                            Tienes {upcomingTimeOff.request_type === 'vacation' ? 'vacaciones' : 'una ausencia'} del
                            <span className="font-bold mx-1">{new Date(upcomingTimeOff.start_date).toLocaleDateString()}</span>
                            al
                            <span className="font-bold mx-1">{new Date(upcomingTimeOff.end_date).toLocaleDateString()}</span>.
                        </p>
                    </div>
                </div>
            )}
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

            {isSuperOrCompanyAdmin && <DashboardStats />}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="col-span-1 md:col-span-2">
                    <TimeTracker />
                </div>
            </div>
        </div>
    )
}

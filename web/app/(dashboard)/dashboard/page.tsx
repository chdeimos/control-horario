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
        <div className="animate-in fade-in duration-700 space-y-8 md:-m-8">
            {/* PandoraSoft Style Header Header */}
            <header className="bg-[#3b60c1] pt-16 pb-24 px-10 relative overflow-hidden mb-8">
                {/* Abstract Background Detail */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-5 w-1 bg-white rounded-full"></div>
                        <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.4em]">Panel de Resumen Operativo</p>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase italic leading-none">
                                In<span className="text-blue-200">icio</span>
                            </h2>
                            <p className="text-blue-100/60 mt-4 text-[10px] font-bold uppercase tracking-widest max-w-lg leading-relaxed">
                                Supervisión de métricas individuales, estado de la jornada y avisos del sistema en tiempo real.
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-10 space-y-8 pb-12">
                {upcomingTimeOff && (
                    <div className="bg-white border border-blue-50 rounded-2xl shadow-xl shadow-blue-900/5 p-6 flex items-center gap-6 group transition-all hover:shadow-2xl">
                        <div className="bg-blue-600 p-4 rounded-xl shadow-lg shadow-blue-200 transform group-hover:scale-105 transition-transform">
                            <span className="text-2xl">📅</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-1">Próxima Ausencia</p>
                            <h3 className="font-bold text-slate-900 tracking-tight">
                                Tienes {upcomingTimeOff.request_type === 'vacation' ? 'vacaciones' : 'una ausencia'} del
                                <span className="text-blue-600 mx-2">{new Date(upcomingTimeOff.start_date).toLocaleDateString()}</span>
                                al
                                <span className="text-blue-600 ml-2">{new Date(upcomingTimeOff.end_date).toLocaleDateString()}</span>
                            </h3>
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-3">
                    <div className="h-6 w-1 bg-slate-900 rounded-full"></div>
                    <h2 className="text-sm font-black tracking-widest text-slate-900 uppercase">Resumen de Actividad</h2>
                </div>

                {isSuperOrCompanyAdmin && <DashboardStats />}

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="col-span-1 md:col-span-2">
                        <TimeTracker />
                    </div>
                </div>
            </div>
        </div>
    )
}

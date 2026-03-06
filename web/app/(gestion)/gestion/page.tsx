import { DashboardStats } from "@/components/features/dashboard-stats"
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()

    // Fetch upcoming approved time off
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
        .maybeSingle()

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
                                Dashboard
                            </h2>
                            <p className="text-blue-100/80 text-base font-medium max-w-lg">
                                Panel de control centralizado para auditoría global, indicadores de rendimiento y gestión estratégica de personal.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
                            <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.5)]"></div>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Sistemas Operativos</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-10 -mt-12 relative z-20 space-y-12 pb-20">
                {upcomingTimeOff && (
                    <div className="relative overflow-hidden bg-white border border-blue-50 rounded-[5px] shadow-xl shadow-blue-900/5 group transition-all hover:shadow-2xl">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-full blur-3xl -mr-24 -mt-24 opacity-30 group-hover:opacity-60 transition-opacity"></div>
                        <div className="relative z-10 p-8 flex items-center gap-8">
                            <div className="w-16 h-16 bg-blue-600 rounded-[5px] flex items-center justify-center text-4xl shadow-xl shadow-blue-200 shrink-0 transform group-hover:scale-105 transition-transform">
                                📅
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2">Próxima Ausencia Programada</p>
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                    Tienes {upcomingTimeOff.request_type === 'vacation' ? 'vacaciones' : 'una ausencia'} del
                                    <span className="text-blue-600 mx-3">{new Date(upcomingTimeOff.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</span>
                                    al
                                    <span className="text-blue-600 ml-3">{new Date(upcomingTimeOff.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</span>
                                </h3>
                            </div>
                        </div>
                    </div>
                )}

                <DashboardStats />
            </div>
        </div>
    )
}

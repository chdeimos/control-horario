import { createClient } from '@/lib/supabase/server'
import { Badge } from "@/components/ui/badge"
import { RequestTimeOffDialog } from './request-dialog'
import { MyRequestsTable } from './my-requests-table'
import { Palmtree, Calendar, Info, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

// Helper to count days
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

    // 1. Mis solicitudes
    const { data: myRequestsData } = await supabase
        .from('time_off_requests')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

    const myRequests = myRequestsData || []

    // 2. Calculate Balance
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
        <div className="min-h-screen bg-[#f8fafc] md:-m-12">
            {/* PandoraSoft Full-Width Blue Banner */}
            <div className="bg-[#3b60c1] pt-16 pb-24 px-10 text-white">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold tracking-tight mb-2">
                        Días Libres
                    </h2>
                    <p className="text-blue-100/80 text-base font-medium">
                        Planifica tus descansos y consulta el estado de tus solicitudes de forma rápida y sencilla.
                    </p>
                </div>
            </div>

            {/* Content Area - Matches Mockup Structure */}
            <div className="max-w-7xl mx-auto px-6 sm:px-10 -mt-12 space-y-8 pb-10">
                {/* Balance Summary Grid - Matches Mockup */}
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Vacation Card */}
                    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col h-full">
                        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center text-[#5c89d8]">
                                <Palmtree size={20} className="sm:hidden" strokeWidth={1.5} />
                                <Palmtree size={24} className="hidden sm:block" strokeWidth={1.5} />
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">VACACIONES</span>
                        </div>

                        <div className="text-center mb-6 sm:mb-8">
                            <span className="text-5xl sm:text-7xl font-bold text-slate-800">{remainingVacation}</span>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-400 mt-2 tracking-widest uppercase">DISPONIBLES</p>
                        </div>

                        <div className="mt-auto space-y-4">
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-[#4fb8f3] h-full transition-all duration-1000" style={{ width: `${(usedVacation / totalVacation) * 100}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                <span>CONSUMIDOS: {usedVacation} DÍAS</span>
                                <span>TOTAL: {totalVacation}</span>
                            </div>
                        </div>
                    </div>

                    {/* Personal Days Card */}
                    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col h-full">
                        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#edf2ff] rounded-lg flex items-center justify-center text-[#4c6ef5]">
                                <Calendar size={20} className="sm:hidden" strokeWidth={1.5} />
                                <Calendar size={24} className="hidden sm:block" strokeWidth={1.5} />
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ASUNTOS PROPIOS</span>
                        </div>

                        <div className="text-center mb-6 sm:mb-8">
                            <span className="text-5xl sm:text-7xl font-bold text-slate-800">{remainingPersonal}</span>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-400 mt-2 tracking-widest uppercase">DÍAS</p>
                        </div>

                        <div className="mt-auto space-y-4">
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-[#3e5da1] h-full transition-all duration-1000" style={{ width: `${totalPersonal > 0 ? (usedPersonal / totalPersonal) * 100 : 0}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                <span>DISFRUTADOS: {usedPersonal}</span>
                                <span>LÍMITE: {totalPersonal}</span>
                            </div>
                        </div>
                    </div>

                    {/* Call to Action Card */}
                    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center justify-center space-y-4">
                        <h4 className="text-lg sm:text-xl font-bold text-slate-800">¿Necesitas un descanso?</h4>
                        <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed max-w-[220px]">
                            Planifica tus descansos y consulta el estado de tus solicitudes de descansos.
                        </p>
                        <div className="pt-4 w-full">
                            <RequestTimeOffDialog
                                vacationBalance={remainingVacation}
                                personalBalance={remainingPersonal}
                            />
                        </div>
                    </div>
                </div>

                {/* My Requests Section - Matches Mockup */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-8">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-800">Historial de Solicitudes</h3>
                    </div>
                    <div className="px-0">
                        <MyRequestsTable requests={myRequests} />
                    </div>
                </div>
            </div>
        </div>
    )
}

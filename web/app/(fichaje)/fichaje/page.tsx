import { TimeTracker } from "@/components/features/time-tracker"
import { createClient } from '@/lib/supabase/server'
import { Clock, Palmtree, Calendar } from "lucide-react"

export default async function FichajePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('full_name, role, department_id, schedule_type, total_vacation_days, total_personal_days, scheduled_hours, departments(name)').eq('id', user?.id).single()

    // Fetch user schedule for today (in Madrid time)
    const madridNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }))
    const dayOfWeek = madridNow.getDay() || 7 // 1 (Mon) to 7 (Sun)
    const { data: todaySchedule } = await supabase
        .from('work_schedules')
        .select('*')
        .eq('profile_id', user?.id)
        .eq('day_of_week', dayOfWeek)
        .maybeSingle()

    const isFixedSchedule = profile?.schedule_type === 'fixed'
    const isWorkingDayBySchedule = !!todaySchedule

    // Check if user is on time off TODAY (Vacations, Personal Days, Sick Leave, etc.)
    const today = new Date().toISOString().split('T')[0]
    const { data: currentTimeOff } = await supabase
        .from('time_off_requests')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'approved')
        .lte('start_date', today)
        .gte('end_date', today)
        .maybeSingle()

    const isOnTimeOff = !!currentTimeOff
    const isNonWorkingDay = !todaySchedule || isOnTimeOff

    const returnDate = currentTimeOff ? new Date(new Date(currentTimeOff.end_date).getTime() + 24 * 60 * 60 * 1000) : null
    const formattedReturnDate = returnDate ? returnDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) : ''

    // Calculate time off balances
    const { data: allTimeOff } = await supabase
        .from('time_off_requests')
        .select('start_date, end_date, request_type, status')
        .eq('user_id', user?.id)
        .eq('status', 'approved')

    function getDaysDiff(start: string, end: string) {
        const d1 = new Date(start)
        const d2 = new Date(end)
        return Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1
    }

    let usedVacation = 0
    let usedPersonal = 0
    allTimeOff?.forEach(req => {
        const days = getDaysDiff(req.start_date, req.end_date)
        if (req.request_type === 'vacation') usedVacation += days
        else if (req.request_type === 'personal') usedPersonal += days
    })

    const remainingVacation = (profile?.total_vacation_days || 22) - usedVacation
    const remainingPersonal = (profile?.total_personal_days || 0) - usedPersonal

    // Map request types to friendly messages
    const timeOffMessages: Record<string, string> = {
        vacation: `🌟 ¡Felices vacaciones! Te esperamos el ${formattedReturnDate}`,
        personal: `🏠 Disfruta de tu día de asuntos propios. Volvemos el ${formattedReturnDate}`,
        sick_leave: `🩹 Recupérate pronto. Te esperamos a la vuelta el ${formattedReturnDate}`,
        default: `✨ Disfruta de tu día libre. Nos vemos el ${formattedReturnDate}`
    }
    const currentMessage = currentTimeOff ? (timeOffMessages[currentTimeOff.request_type] || timeOffMessages.default) : ''

    function formatTime(time: string) {
        if (!time) return ''
        return time.substring(0, 5)
    }

    const scheduleText = todaySchedule ? (
        isFixedSchedule ? (
            `${formatTime(todaySchedule.start_time)} - ${formatTime(todaySchedule.end_time)}${todaySchedule.start_time_2 ? ` / ${formatTime(todaySchedule.start_time_2)} - ${formatTime(todaySchedule.end_time_2)}` : ''}`
        ) : (
            `OBJETIVO: ${todaySchedule.target_total_hours} HORAS`
        )
    ) : null;

    const noWorkPhrases = [
        "¡Tómate un respiro! Hoy el sistema dice que te toca descansar. ✨",
        "¡Día de relax! Hoy no tienes turnos programados. ¡Disfruta! 🏖️",
        "Cerrado por descanso. ¡Hoy no toca fichar, aprovecha el día! 🔋",
        "Recarga pilas: hoy no tienes horario de trabajo asignado. 🧘"
    ];
    const noWorkPhrase = noWorkPhrases[new Date().getDate() % noWorkPhrases.length];

    // Fetch upcoming approved time off for desktop sidebar
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

    // Fetch total hours worked today (including active one) in Spain time
    const nowLocal = new Date()
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    const parts = formatter.formatToParts(nowLocal)
    const madridMap: any = {}
    parts.forEach(p => madridMap[p.type] = p.value)

    // Create a Date object representing 00:00:00 in Madrid today
    const startOfMadridToday = new Date(`${madridMap.year}-${madridMap.month}-${madridMap.day}T00:00:00+01:00`)
    // Note: +01:00 is Winter time. Ideally we'd calculate the offset dynamically, 
    // but for now this is much better than UTC 00:00. 
    // For a production app, using a library like date-fns-tz or luxon is better.

    const { data: todayEntries } = await supabase
        .from('time_entries')
        .select('clock_in, clock_out')
        .eq('user_id', user?.id)
        .gte('clock_in', startOfMadridToday.toISOString())

    const now = new Date().getTime()
    const totalMinutes = todayEntries?.reduce((acc, entry) => {
        const start = new Date(entry.clock_in).getTime()
        const end = entry.clock_out ? new Date(entry.clock_out).getTime() : now
        return acc + (end - start) / (1000 * 60)
    }, 0) || 0

    const hours = Math.floor(totalMinutes / 60)
    const minutes = Math.round(totalMinutes % 60)
    const formattedTotalToday = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`

    // Calculate target hours for progress
    let targetMinutes = 0
    const defaultTargetHours = profile?.scheduled_hours ?? 8.0

    if (todaySchedule) {
        if (profile?.schedule_type === 'flexible') {
            targetMinutes = (todaySchedule.target_total_hours || defaultTargetHours) * 60
        } else if (todaySchedule.start_time && todaySchedule.end_time) {
            const timeToMinutes = (t: string) => {
                if (!t) return 0
                const [h, m] = t.split(':').map(Number)
                return (h || 0) * 60 + (m || 0)
            }
            targetMinutes = timeToMinutes(todaySchedule.end_time) - timeToMinutes(todaySchedule.start_time)
            if (todaySchedule.start_time_2 && todaySchedule.end_time_2) {
                targetMinutes += timeToMinutes(todaySchedule.end_time_2) - timeToMinutes(todaySchedule.start_time_2)
            }
            // Fallback if fixed calculation resulted in 0 but there is a target (rare)
            if (targetMinutes <= 0) targetMinutes = (todaySchedule.target_total_hours || defaultTargetHours) * 60
        } else {
            targetMinutes = (todaySchedule.target_total_hours || defaultTargetHours) * 60
        }
    }

    const remainingMinutesGoal = Math.max(0, targetMinutes - totalMinutes)
    const remHours = Math.floor(remainingMinutesGoal / 60)
    const remMins = Math.round(remainingMinutesGoal % 60)
    const formattedRemaining = remainingMinutesGoal > 0 ? `${remHours}h ${remMins}m` : '¡Objetivo cumplido!'

    return (
        <div className="grid gap-6 lg:grid-cols-12 items-start max-w-[1200px] mx-auto md:px-6">
            {/* Main Section: Hello Card (Desktop Only) and Clocking System */}
            <div className="lg:col-span-8 space-y-6">
                {/* Hello Card - Hidden on Mobile (moved to layout header) */}
                <div className="hidden lg:flex bg-[#3b60c1] rounded-lg p-8 text-white shadow-lg overflow-hidden relative min-h-[160px] flex-col justify-center">
                    <h2 className="text-4xl font-black tracking-tight mb-2 leading-tight">
                        ¡Hola, {profile?.full_name?.split(' ')[0] || 'Usuario'}! <span className="inline-block">👋</span>
                    </h2>
                    {isOnTimeOff ? (
                        <p className="text-amber-200 text-sm font-bold uppercase tracking-widest mt-1">
                            {currentMessage}
                        </p>
                    ) : !todaySchedule ? (
                        <p className="text-blue-200 text-sm font-bold uppercase tracking-widest opacity-80 mt-1">
                            {noWorkPhrase}
                        </p>
                    ) : (
                        <p className="text-blue-100 text-sm font-bold uppercase tracking-widest opacity-80 mt-1">
                            {isFixedSchedule ? 'HORARIO: ' : ''}{scheduleText}
                        </p>
                    )}
                </div>

                {/* Clocking System Container - Full Navy on Mobile */}
                <div className="bg-[#1e293b] md:bg-white md:rounded-lg md:shadow-sm md:border border-slate-100 p-10 md:p-10 flex flex-col items-center">
                    <div className="text-center mb-8 hidden md:block">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Registro Diario</h3>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest" suppressHydrationWarning>
                            Madrid • {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })}
                        </p>
                    </div>

                    <TimeTracker isNonWorkingDay={isNonWorkingDay} />
                </div>
            </div>

            {/* Right Column / Bottom Section: Statistics Cards */}
            <div className="lg:col-span-4 space-y-4 p-4 md:p-0">
                <div className="bg-white rounded-lg p-6 md:p-8 border border-slate-100 md:border-[#c5e8de] md:bg-[#e7f6f2] flex items-center justify-between group transition-all min-h-[100px] shadow-sm md:shadow-none">
                    <div className="flex flex-col">
                        <p className="text-[10px] md:text-[11px] font-black text-slate-400 md:text-[#569483]/60 uppercase tracking-[0.2em] mb-1">Próximas Vacaciones</p>
                        <p className="text-xl md:text-2xl font-black text-slate-900 md:text-[#569483] tracking-tight">
                            {upcomingTimeOff ? (
                                `${new Date(upcomingTimeOff.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${new Date(upcomingTimeOff.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
                            ) : (
                                "Sin fechas próximas"
                            )}
                        </p>
                    </div>
                    {upcomingTimeOff && <div className="text-3xl md:hidden">🏝️</div>}
                    <div className="hidden md:block text-[#68ad9a]">
                        <Palmtree size={32} strokeWidth={1.5} />
                    </div>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-1 gap-3 md:gap-4">
                    {/* Hours Today Card */}
                    <div className="bg-white rounded-lg p-3 md:p-8 shadow-sm border border-slate-100 relative overflow-hidden flex flex-col justify-center min-h-[100px] md:min-h-[120px]">
                        <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Horas Hoy</p>
                        <div className="flex flex-col">
                            <div className="flex items-baseline gap-0.5 md:gap-1">
                                <span className="text-xl md:text-5xl font-black tracking-tighter text-slate-900 tabular-nums">{formattedTotalToday}</span>
                                <span className="text-[8px] md:text-sm text-slate-400 font-black uppercase tracking-widest">hrs</span>
                            </div>
                            <p className="hidden md:block text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                RESTANTE <span className="text-slate-600">{formattedRemaining}</span>
                            </p>
                        </div>
                    </div>

                    {/* Vacation Card */}
                    <div className="bg-white rounded-lg p-3 md:p-8 shadow-sm border border-slate-100 relative overflow-hidden flex flex-col justify-center min-h-[100px] md:min-h-[120px]">
                        <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Vacaciones</p>
                        <div className="flex items-baseline gap-0.5 md:gap-1">
                            <span className="text-xl md:text-4xl font-black tracking-tighter text-slate-900 tabular-nums">{remainingVacation}</span>
                            <span className="text-[8px] md:text-sm text-slate-400 font-black uppercase tracking-widest">días</span>
                        </div>
                    </div>

                    {/* Personal Days Card */}
                    <div className="bg-white rounded-lg p-3 md:p-8 shadow-sm border border-slate-100 relative overflow-hidden flex flex-col justify-center min-h-[100px] md:min-h-[120px]">
                        <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Días Libres</p>
                        <div className="flex items-baseline gap-0.5 md:gap-1">
                            <span className="text-xl md:text-4xl font-black tracking-tighter text-slate-900 tabular-nums">{remainingPersonal}</span>
                            <span className="text-[8px] md:text-sm text-slate-400 font-black uppercase tracking-widest">días</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

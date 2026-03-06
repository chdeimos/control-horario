import { getDashboardStats } from '@/app/(dashboard)/dashboard/actions'
import { Users, UserCheck, AlertCircle, Palmtree, Clock } from "lucide-react"
import Link from 'next/link'

export async function DashboardStats() {
    const stats = await getDashboardStats()

    const cards = [
        {
            title: "Total Usuarios",
            value: stats.totalUsers,
            label: "En plantilla",
            icon: Users,
            color: "blue",
            gradient: "from-[#3b60c1] to-indigo-800",
            glow: "bg-[#3b60c1]",
            href: "/gestion/empleados"
        },
        {
            title: "Usuarios Activos",
            value: stats.activeUsers,
            label: "Trabajando ahora",
            icon: UserCheck,
            color: "green",
            gradient: "from-emerald-500 to-green-600",
            glow: "bg-green-400",
            href: "/gestion/registros?filter=active"
        },
        {
            title: "Incidencias",
            value: stats.totalIncidents,
            label: "Requieren revisión",
            icon: AlertCircle,
            color: "red",
            gradient: "from-rose-500 to-red-600",
            glow: "bg-rose-400",
            href: "/gestion/incidencias"
        },
        {
            title: "Ausencias Hoy",
            value: stats.usersOnLeave,
            label: "Vacaciones / Bajas",
            icon: Palmtree,
            color: "amber",
            gradient: "from-amber-500 to-orange-600",
            glow: "bg-amber-400",
            href: "/gestion/dias-libres?status=approved"
        },
        {
            title: "Solicitudes",
            value: stats.pendingLeaveRequests,
            label: "Pendientes",
            icon: Clock,
            color: "indigo",
            gradient: "from-indigo-500 to-indigo-700",
            glow: "bg-indigo-400",
            href: "/gestion/dias-libres?status=pending"
        }
    ]

    return (
        <div className="space-y-8">
            {/* Fila Superior: 3 Filtros principales */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {cards.slice(0, 3).map((card, i) => (
                    <Link
                        key={i}
                        href={card.href}
                        className="group relative overflow-hidden bg-white rounded-lg p-8 shadow-xl shadow-slate-200/40 border border-slate-100 transition-all hover:-translate-y-2 hover:shadow-2xl duration-500 block"
                    >
                        <div className={`absolute top-0 right-0 w-40 h-40 ${card.glow} rounded-full blur-3xl -mr-20 -mt-20 opacity-5 group-hover:opacity-15 transition-opacity duration-700`}></div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-8">
                                <div className={`p-3.5 rounded-lg bg-gradient-to-br ${card.gradient} text-white shadow-xl transform group-hover:rotate-6 transition-transform duration-500`}>
                                    <card.icon size={24} strokeWidth={2.5} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300 group-hover:text-slate-400 transition-colors">
                                    {card.label}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 mt-auto">
                                <div className="flex items-baseline gap-2">
                                    <h4 className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">
                                        {card.value}
                                    </h4>
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest translate-y-[-2px]">
                                        {card.value === 1 ? (card.title === 'Solicitudes' ? 'Item' : 'P') : (card.title === 'Solicitudes' ? 'Items' : 'Ps')}
                                    </span>
                                </div>

                                <p className="mt-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] leading-none">
                                    {card.title}
                                </p>
                            </div>
                        </div>

                        <div className={`absolute bottom-0 left-0 h-1.5 bg-gradient-to-r ${card.gradient} w-0 group-hover:w-full transition-all duration-700 ease-in-out`}></div>
                    </Link>
                ))}
            </div>

            {/* Fila Inferior: 2 Filtros de acción */}
            <div className="grid gap-8 md:grid-cols-2">
                {cards.slice(3, 5).map((card, i) => (
                    <Link
                        key={i + 3}
                        href={card.href}
                        className="group relative overflow-hidden bg-white rounded-lg p-8 shadow-xl shadow-slate-200/40 border border-slate-100 transition-all hover:-translate-y-2 hover:shadow-2xl duration-500 block"
                    >
                        <div className={`absolute top-0 right-0 w-48 h-48 ${card.glow} rounded-full blur-3xl -mr-24 -mt-24 opacity-5 group-hover:opacity-15 transition-opacity duration-700`}></div>

                        <div className="relative z-10 flex items-center justify-between py-2">
                            <div className="flex flex-col gap-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300 group-hover:text-slate-400 transition-colors">
                                    {card.label}
                                </span>
                                <div className="flex items-baseline gap-4">
                                    <h4 className="text-6xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">
                                        {card.value}
                                    </h4>
                                    <div className="flex flex-col">
                                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em]">
                                            {card.title}
                                        </p>
                                        <p className="text-[9px] font-bold text-primary uppercase tracking-widest">Estado por revisar</p>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-5 rounded-lg bg-gradient-to-br ${card.gradient} text-white shadow-xl transform group-hover:scale-110 transition-transform duration-500`}>
                                <card.icon size={32} strokeWidth={2.5} />
                            </div>
                        </div>

                        <div className={`absolute bottom-0 left-0 h-1.5 bg-gradient-to-r ${card.gradient} w-0 group-hover:w-full transition-all duration-700 ease-in-out`}></div>
                    </Link>
                ))}
            </div>
        </div>
    )
}

import { getGlobalStats } from './actions'
import { Card, CardContent } from "@/components/ui/card"
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import {
    TrendingUp,
    Users,
    Building2,
    Wallet,
    UserMinus,
    Building,
    Activity,
    ArrowUpRight,
    Terminal,
    ChevronRight,
    Search,
    ShieldAlert
} from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
    const stats: any = await getGlobalStats()

    if (stats.error) {
        return (
            <div className="p-12 bg-white min-h-screen">
                <div className="bg-rose-50 border border-rose-100 p-8 rounded-xl flex items-center gap-6 text-rose-600 shadow-2xl shadow-rose-200/50">
                    <div className="w-16 h-16 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                        <Terminal size={32} />
                    </div>
                    <div>
                        <h4 className="text-xl font-black uppercase tracking-tight">Acceso Bloqueado</h4>
                        <p className="font-bold text-sm opacity-80 mt-1">Error de Autenticación de Red: {stats.error}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="animate-in fade-in duration-700">
            {/* PandoraSoft Style Header Header */}
            <header className="bg-[#3b60c1] pt-20 pb-32 px-10 relative overflow-hidden md:-m-12 mb-12">
                {/* Abstract Background Detail */}

                <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>

                <div className="max-w-7xl mx-auto relative z-10">

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-white uppercase italic leading-none">Centro de Control</h2>
                            <p className="text-blue-100/60 mt-6 text-xs font-bold uppercase tracking-widest max-w-lg leading-relaxed">
                                Supervisión de métricas de crecimiento, flujos, suscripción y salud.
                            </p>
                        </div>

                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-10 -mt-20 relative z-20 space-y-10">
                {/* Stats Grid */}
                <div className="grid gap-6 md:grid-cols-5">
                    <StatCard
                        label="Empresas Activas"
                        value={stats.activeCompanies}
                        icon={<Building2 size={20} />}
                        trend="100%"
                        color="blue"
                    />
                    <StatCard
                        label="Usuarios Totales"
                        value={stats.activeUsers}
                        icon={<Users size={20} />}
                        trend="100%"
                        color="blue"
                    />
                    <StatCard
                        label="Previsión Facturación"
                        value={`${Math.round(stats.forecast)}€`}
                        icon={<Wallet size={20} />}
                        trend="+22%"
                        color="emerald"
                    />
                    <StatCard
                        label="Baja de Usuarios"
                        value={stats.inactiveUsers}
                        icon={<UserMinus size={20} />}
                        trend="-2%"
                        color="rose"
                    />
                    <StatCard
                        label="Baja de Empresas"
                        value={stats.inactiveCompanies}
                        icon={<Building size={20} />}
                        trend="0%"
                        color="rose"
                    />
                </div>

                <div className="grid gap-10 md:grid-cols-12 pb-20">
                    {/* Main Chart Card */}
                    <div className="md:col-span-8 bg-white border border-slate-100 p-10 rounded-2xl shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Crecimiento de Facturación</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Histórico de ingresos netos mensuales</p>
                            </div>
                            <div className="flex items-center gap-2 text-[#3b60c1] px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                <Activity size={12} />
                                Métricas en Vivo
                            </div>
                        </div>

                        <div className="h-[320px] w-full flex items-end justify-between gap-3 relative px-2">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between opacity-[0.03] pointer-events-none pb-14">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-[2px] w-full bg-slate-900"></div>
                                ))}
                            </div>

                            {/* Bars */}
                            {stats.history?.map((point: any, i: number) => {
                                const maxValue = Math.max(...stats.history.map((h: any) => h.value), 100);
                                const height = `${(point.value / maxValue) * 100}%`;

                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center group/bar relative h-full justify-end">
                                        <div
                                            className="w-full bg-[#3b60c1]/5 border-t-4 border-[#3b60c1]/20 group-hover/bar:bg-[#3b60c1]/20 group-hover/bar:border-[#3b60c1] transition-all duration-500 relative rounded-t-sm"
                                            style={{ height }}
                                        >
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all bg-white border border-slate-100 shadow-xl px-3 py-2 rounded-lg text-[10px] font-black text-[#3b60c1] z-20 whitespace-nowrap scale-90 group-hover/bar:scale-100">
                                                {point.value} €
                                            </div>
                                        </div>
                                        <div className="h-14 flex items-center">
                                            <span className="text-[9px] font-black text-slate-400 group-hover/bar:text-[#3b60c1] transition-colors uppercase tracking-widest">
                                                {point.label}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Sidebar Dashboards */}
                    <div className="md:col-span-4 flex flex-col gap-8">
                        {/* Audit Terminal Card */}
                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl shadow-slate-900/40 flex flex-col h-[480px]">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-white/40">
                                        <ShieldAlert size={14} />
                                    </div>
                                    <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Seguridad d105</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-black text-emerald-500/50 uppercase tracking-widest">En Vivo</span>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></div>
                                </div>
                            </div>

                            <div className="flex-1 space-y-5 overflow-y-auto no-scrollbar pr-2">
                                {stats.auditLogs?.length > 0 ? (
                                    stats.auditLogs.map((log: any, i: number) => (
                                        <div key={i} className="group/log border-l-2 border-white/5 pl-5 py-0.5 hover:border-[#3b60c1]/40 transition-all">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`text-[8px] font-black px-2 py-1 rounded-sm ${log.status === 'success' ? 'text-emerald-400 bg-emerald-400/10' :
                                                    'text-rose-400 bg-rose-400/10'
                                                    }`}>
                                                    {log.type}
                                                </span>
                                                <span className="text-[8px] font-bold text-white/20 tabular-nums uppercase">
                                                    {format(new Date(log.time), 'HH:mm (dd MMM)', { locale: es })}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-white/50 leading-relaxed group-hover/log:text-white/80 transition-colors line-clamp-2">
                                                {log.message}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
                                        <Activity size={32} className="text-white" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white">Sin actividad detectada</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-6 border-t border-white/5">
                                <Link
                                    href="/d105/logs"
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group/btn"
                                >
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Registros Completos</span>
                                    <ArrowUpRight size={14} className="text-white/40 group-hover/btn:text-[#3b60c1] group-hover/btn:translate-x-0.5 transition-all" />
                                </Link>
                            </div>
                        </div>

                        {/* Promo Card */}
                        <div className="p-8 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#3b60c1]/5 blur-3xl rounded-full group-hover:bg-[#3b60c1]/10 transition-all"></div>

                            <div className="w-10 h-10 bg-blue-50 text-[#3b60c1] rounded-xl flex items-center justify-center border border-blue-100 mb-6">
                                <TrendingUp size={18} />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3 italic">Optimización SaaS</h4>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide leading-relaxed">
                                Mejora de tasa de retención <span className="text-emerald-600">+12%</span> tras actualización v2.4.
                            </p>

                            <div className="mt-8 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#3b60c1] cursor-pointer hover:translate-x-1 transition-all">
                                Ver Reporte Completo
                                <ChevronRight size={14} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ label, value, icon, trend, color }: { label: string, value: string | number, icon: React.ReactNode, trend: string, color: 'blue' | 'rose' | 'emerald' | 'amber' }) {
    const schemes = {
        blue: {
            iconBox: 'bg-blue-50 text-[#3b60c1] border-blue-100',
            trend: 'text-emerald-500',
            hover: 'hover:border-blue-100'
        },
        rose: {
            iconBox: 'bg-rose-50 text-rose-500 border-rose-100',
            trend: 'text-rose-500',
            hover: 'hover:border-rose-100'
        },
        emerald: {
            iconBox: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            trend: 'text-emerald-500',
            hover: 'hover:border-emerald-100'
        },
        amber: {
            iconBox: 'bg-amber-50 text-amber-600 border-amber-100',
            trend: 'text-amber-600',
            hover: 'hover:border-amber-100'
        }
    }

    const s = schemes[color]

    return (
        <Card className={`group relative bg-white border border-slate-100 p-8 overflow-hidden transition-all duration-500 rounded-2xl shadow-lg shadow-slate-100 hover:shadow-2xl hover:shadow-slate-200 ${s.hover} hover:-translate-y-1`}>
            {/* Background Detail */}
            <div className={`absolute -right-8 -bottom-8 w-32 h-32 blur-3xl opacity-[0.05] group-hover:opacity-[0.15] transition-all duration-700 bg-current`}></div>

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`w-10 h-10 ${s.iconBox} rounded-xl flex items-center justify-center border shadow-sm group-hover:scale-110 transition-all duration-500`}>
                    {icon}
                </div>
                <div className={`text-[10px] font-black uppercase tracking-widest ${s.trend}`}>
                    {trend}
                </div>
            </div>

            <div className="relative z-10 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{label}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter leading-none italic uppercase">
                        {value}
                    </h3>
                </div>
            </div>
        </Card>
    )
}

import { getGlobalUsers } from "./actions"
import { UsersTable } from "./users-table"
import { Users, ShieldCheck, Activity } from "lucide-react"

export const metadata = {
    title: 'Gestión de Usuarios | Admin Control Horario',
}

export default async function UsersPage() {
    const { data: users, error } = await getGlobalUsers()

    if (error) {
        return (
            <div className="p-10 bg-white min-h-screen">
                <div className="bg-rose-50 border border-rose-100 p-8 rounded-xl flex items-center gap-6 text-rose-600 shadow-2xl shadow-rose-200/50">
                    <div className="w-16 h-16 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <h4 className="text-xl font-black uppercase tracking-tight">Acceso Interrumpido</h4>
                        <p className="font-bold text-sm opacity-80 mt-1">Error de Sincronización de Usuarios: {error}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="animate-in fade-in duration-700">
            {/* Blue Banner Header */}
            <header className="bg-[#3b60c1] pt-20 pb-32 px-10 relative overflow-hidden md:-m-12 mb-12">
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <h2 className="text-4xl font-black tracking-tight text-white uppercase leading-none">
                                Lista de Usuarios
                            </h2>
                            <p className="text-blue-100/60 mt-6 text-xs font-bold uppercase tracking-widest max-w-lg leading-relaxed">
                                Control de accesos globales, asignación de privilegios y monitoreo de actividad.
                            </p>
                        </div>
                        <div className="hidden md:flex items-center gap-6">
                            {/* Premium Metric Card (Glassmorphism) */}
                            <div className="flex items-center gap-6 px-8 py-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:bg-white/15 transition-all duration-500">
                                {/* Decorative Glow */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-white/10 transition-colors"></div>

                                <div className="h-14 w-14 bg-white/10 rounded-[1.2rem] flex items-center justify-center text-white border border-white/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <Users size={24} className="opacity-80" />
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-blue-100/60 uppercase tracking-[0.25em] mb-1">TOTAL USUARIOS</p>
                                    <div className="flex items-baseline gap-3">
                                        <p className="text-5xl font-black text-white tabular-nums tracking-tighter leading-none">{(users || []).length}</p>
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Entidades</span>
                                    </div>
                                </div>

                                {/* Status Divider */}
                                <div className="h-10 w-px bg-white/10 mx-2"></div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse"></div>
                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                                            <span className="text-white">{(users || []).filter(u => u.is_active).length}</span> ACTIVOS
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div>
                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                                            <span className="text-white">{(users || []).filter(u => !u.is_active).length}</span> BAJAS
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-10 -mt-20 relative z-20 pb-20">
                <UsersTable initialUsers={users || []} />
            </div>
        </div>
    )
}

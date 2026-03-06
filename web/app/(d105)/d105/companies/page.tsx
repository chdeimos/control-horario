import { getCompanies } from './actions'
import { getPlans } from '../plans/actions'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EditCompanyDialog } from './edit-dialog'
import { AddCompanyDialog } from './add-company-dialog'
import { AddAdminDialog } from './add-admin-dialog'
import { Building2, Globe, ShieldCheck, XCircle, Users, Activity, ExternalLink, Phone } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function AdminCompaniesPage() {
    const { data: companies, error } = await getCompanies()
    const { data: plans } = await getPlans()

    if (error) {
        return (
            <div className="p-10 bg-white min-h-screen">
                <div className="bg-rose-50 border border-rose-100 p-8 rounded-xl flex items-center gap-6 text-rose-600 shadow-2xl shadow-rose-200/50">
                    <div className="w-16 h-16 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                        <XCircle size={32} />
                    </div>
                    <div>
                        <h4 className="text-xl font-black uppercase tracking-tight">Fallo Crítico de Red</h4>
                        <p className="font-bold text-sm opacity-80 mt-1">Sincronización interrumpida: {error}</p>
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
                                Sedes y Empresas
                            </h2>
                            <p className="text-blue-100/60 mt-6 text-xs font-bold uppercase tracking-widest max-w-lg leading-relaxed">
                                Supervisión y control centralizado de instancias operativas y despliegue de licencias corporativas.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <AddCompanyDialog plans={plans || []} />
                        </div>
                    </div>
                </div>
            </header>

            {/* Content Table Area */}
            <div className="max-w-7xl mx-auto px-10 -mt-20 relative z-20 pb-20">
                <div className="bg-white rounded-lg shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-3">
                            <Activity className="text-[#3b60c1]" size={18} />
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Empresas registradas ({companies?.length || 0})</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronización en Tiempo Real</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table className="table-fixed w-full min-w-[1000px]">
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="border-b border-slate-100/50 hover:bg-transparent">
                                    <TableHead className="w-[400px] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6 pl-10">Empresa / Id fiscal</TableHead>
                                    <TableHead className="w-[150px] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">Teléfono</TableHead>
                                    <TableHead className="w-[150px] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">Plan</TableHead>
                                    <TableHead className="w-[150px] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">Carga Usuarios</TableHead>
                                    <TableHead className="w-[150px] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">Estado</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6 text-right pr-10">Operaciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {companies?.map((company: any) => (
                                    <TableRow
                                        key={company.id}
                                        className="border-b border-slate-50 hover:bg-blue-50/30 transition-all group relative"
                                    >
                                        <TableCell className="py-8 pl-10">
                                            <div>
                                                <p className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none mb-2 group-hover:text-[#3b60c1] transition-colors">{company.name}</p>
                                                <span className="text-[10px] font-bold text-slate-400 tabular-nums uppercase tracking-[0.2em]">
                                                    {company.cif}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-8">
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50/50 rounded-lg border border-slate-100 w-fit">
                                                <Phone size={12} className="text-slate-400" />
                                                <span className="text-xs font-black text-slate-700 tabular-nums uppercase tracking-widest font-mono">
                                                    {company.phone || 'S_TEL_ACTIVO'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-8">
                                            <Badge className="rounded-md border-[#3b60c1]/10 text-[#3b60c1] bg-blue-50 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 shadow-sm">
                                                {company.plans?.name || 'VINCULAR_PLAN'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl font-black text-slate-900 tabular-nums leading-none">{company.active_users}</span>
                                                        <Users size={12} className="text-slate-300" />
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Activos</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-8">
                                            {company.is_active ? (
                                                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 w-fit px-3 py-1.5 rounded-full border border-emerald-100">
                                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Protegido</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-rose-500 bg-rose-50 w-fit px-3 py-1.5 rounded-full border border-rose-100">
                                                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Desactivado</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-8 text-right pr-10">
                                            <div className="flex items-center justify-end gap-3 transition-all duration-300">
                                                <AddAdminDialog companyId={company.id} companyName={company.name} />
                                                <EditCompanyDialog company={company} plans={plans || []} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {companies?.length === 0 && (
                            <div className="py-32 text-center flex flex-col items-center justify-center gap-8 bg-slate-50/20">
                                <div className="w-24 h-24 bg-white rounded-lg shadow-xl flex items-center justify-center border border-slate-100 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-blue-50/50 scale-0 group-hover:scale-100 transition-transform duration-700 rounded-full"></div>
                                    <Globe size={40} className="text-slate-200 group-hover:text-[#3b60c1] transition-colors relative z-10" />
                                </div>
                                <div className="space-y-3">
                                    <p className="text-lg font-black text-slate-900 uppercase tracking-tighter">Fase de Red Vacía</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                                        No se detectan instancias corporativas vinculadas al núcleo central. Comienza registrando un nuevo nodo.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

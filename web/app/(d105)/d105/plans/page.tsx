import { getPlans } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Users, Zap, Layers, Activity, Star, Info, LayoutTemplate, Building2 } from "lucide-react"
import { AddPlanDialog } from './add-plan-dialog'
import { DiscountList } from './discount-list'
import { DeletePlanDialog } from './delete-plan-dialog'
import { EditPlanDialog } from './edit-plan-dialog'

export const dynamic = 'force-dynamic'

export default async function PlansPage() {
    const { data: plans, error } = await getPlans()

    if (error) {
        return (
            <div className="p-10 bg-white min-h-screen">
                <div className="bg-rose-50 border border-rose-100 p-8 rounded-xl flex items-center gap-6 text-rose-600 shadow-2xl shadow-rose-200/50">
                    <div className="w-16 h-16 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                        <Activity size={32} />
                    </div>
                    <div>
                        <h4 className="text-xl font-black uppercase tracking-tight">Fallo en Lógica Planaria</h4>
                        <p className="font-bold text-sm opacity-80 mt-1">Error de Sincronización de Precios: {error}</p>
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
                                Gestión de Planes
                            </h2>
                            <p className="text-blue-100/60 mt-6 text-xs font-bold uppercase tracking-widest max-w-lg leading-relaxed">
                                Definición de estrategias de precios, límites de recursos y optimización de rendimientos operativos.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <AddPlanDialog />
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-10 -mt-20 relative z-20 pb-20">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {plans?.map((plan: any, index: number) => (
                        <Card
                            key={plan.id}
                            className="group bg-white border border-slate-100 rounded-lg shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-[#3b60c1]/10 transition-all duration-500 overflow-hidden flex flex-col hover:-translate-y-1"
                        >
                            {/* Accent line top */}
                            <div className="h-2 bg-[#3b60c1] opacity-20 transition-opacity group-hover:opacity-100"></div>

                            <div className="p-10 border-b border-slate-50 relative overflow-hidden bg-white">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 -mr-16 -mt-16 rounded-full blur-3xl"></div>

                                <div className="flex justify-between items-start mb-10 relative z-10">
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter group-hover:text-[#3b60c1] transition-colors">
                                            {plan.name}
                                        </h3>
                                        <Badge className="w-fit rounded-lg border-blue-100 text-[#3b60c1] bg-blue-50 text-[9px] font-black uppercase tracking-widest px-2.5 py-1">
                                            {plan.billing_type === 'fixed' ? 'Tarifa Plana' : 'Escalado Dinámico'}
                                        </Badge>
                                    </div>
                                    <div className="flex gap-2 p-2 bg-slate-50 rounded-xl opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                                        <EditPlanDialog plan={plan} />
                                        <DeletePlanDialog plan={plan} allPlans={plans} />
                                    </div>
                                </div>

                                <div className="relative z-10 flex flex-col">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-7xl font-black text-slate-900 tabular-nums tracking-tighter leading-none">
                                            {plan.billing_type === 'fixed' ? Math.round(plan.fixed_price) : plan.price_per_user}€
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                {plan.billing_type === 'fixed' ? 'Por Mes' : 'Por Empleado'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 space-y-12 flex-grow bg-white">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Layers size={16} className="text-[#3b60c1]/40" />
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Límites del plan</h4>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group/item overflow-hidden transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-100">
                                        <p className="text-[13px] font-bold text-slate-600 leading-relaxed relative z-10">
                                            {plan.billing_type === 'fixed'
                                                ? `Capacidad máxima activa de ${plan.fixed_users_limit} puestos de trabajo por instancia.`
                                                : 'Soporte ilimitado bajo demanda con escalado automático de precios.'}
                                        </p>
                                        <div className="absolute left-0 bottom-0 h-1 w-full bg-[#3b60c1] scale-x-0 group-hover/item:scale-x-100 transition-transform origin-left duration-700"></div>
                                    </div>
                                </div>

                                {plan.billing_type === 'per_user' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <Zap size={16} className="text-[#3b60c1]/40" />
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descuentos por Volumen</h4>
                                        </div>
                                        <DiscountList planId={plan.id} discounts={plan.volume_discounts || []} />
                                    </div>
                                )}

                                {plan.billing_type === 'fixed' && plan.price_per_user > 0 && (
                                    <div className="p-6 bg-blue-50/40 border border-blue-100 rounded-2xl group/extra transition-all hover:bg-[#3b60c1] hover:border-[#3b60c1]">
                                        <p className="text-[9px] font-black text-[#3b60c1] uppercase tracking-[0.2em] mb-3 group-hover:text-white/60 transition-colors">Cobro Extra por Nodo Overload</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 bg-[#3b60c1] rounded-full group-hover:bg-white transition-colors"></div>
                                            <p className="text-[13px] font-black text-slate-900 tracking-tight group-hover:text-white transition-colors italic">
                                                +{plan.price_per_user}€ por cada usuario adicional.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 border-t border-slate-50 flex justify-between items-center bg-white mt-auto">
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg">
                                        <Building2 size={14} className="text-[#3b60c1]/40" />
                                        <span className="text-sm font-black text-slate-900 tabular-nums">
                                            {plan.companies_count}
                                            <span className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">Empresas</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50/50 border border-blue-100/50 rounded-lg">
                                        <Users size={14} className="text-[#3b60c1]" />
                                        <span className="text-sm font-black text-[#3b60c1] tabular-nums">
                                            {plan.active_users_count}
                                            <span className="text-[10px] text-[#3b60c1]/60 uppercase tracking-widest ml-1">Activos</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {plans?.length === 0 && (
                        <div className="col-span-full py-32 text-center flex flex-col items-center justify-center gap-8 bg-white rounded-lg border border-dashed border-slate-200">
                            <div className="w-24 h-24 bg-slate-50 rounded-lg flex items-center justify-center text-slate-200">
                                <LayoutTemplate size={48} />
                            </div>
                            <div className="space-y-3">
                                <p className="text-xl font-black text-slate-900 uppercase tracking-tight">Sin Protocolos Planarios</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] max-w-sm mx-auto leading-relaxed">
                                    El núcleo central requiere la inyección de al menos una estrategia de precios operativa.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

import { getBillingData, getInvoices } from './actions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SimulationButton } from './simulation-button'
import { ExportPDFButton } from './export-pdf-button'
import { MetricsTable } from './metrics-table'
import { InvoicesTable } from './invoices-table'
import { ReceiptText, PieChart, Activity, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function BillingPage({ searchParams }: { searchParams: any }) {
    const params = await searchParams
    const now = new Date()
    const month = params.month ? parseInt(params.month) : now.getMonth() + 1
    const year = params.year ? parseInt(params.year) : now.getFullYear()

    const { data: metrics, error: metricsError } = await getBillingData(month, year)
    const { data: invoices, error: invoicesError } = await getInvoices()

    if (metricsError) return <div className="p-10 bg-white min-h-screen text-rose-600 font-bold">Error en métricas: {metricsError}</div>
    if (invoicesError) return <div className="p-10 bg-white min-h-screen text-rose-600 font-bold">Error en facturas: {invoicesError}</div>

    return (
        <div className="animate-in fade-in duration-700">
            {/* Blue Banner Header - Unrestricted Width */}
            <header className="bg-[#3b60c1] pt-20 pb-32 px-10 relative overflow-hidden md:-m-12 mb-12">
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                        <div>
                            <h2 className="text-4xl font-black tracking-tight text-white uppercase leading-none">
                                Facturación
                            </h2>
                            <p className="text-blue-100/60 mt-6 text-xs font-bold uppercase tracking-widest max-w-lg leading-relaxed">
                                Control global de ingresos, métricas de consumo y protocolos de cierre financiero.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <ExportPDFButton data={metrics || []} month={month} year={year} />
                        </div>
                    </div>

                    <Tabs defaultValue="invoices" className="w-full">
                        {/* Underline Style Tabs (Design Guidelines Section 4) */}
                        <TabsList className="bg-transparent border-b border-white/20 h-auto p-0 w-full justify-start gap-10 rounded-none overflow-x-auto no-scrollbar">
                            <TabsTrigger
                                value="invoices"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-blue-100/60 text-[11px] font-black uppercase tracking-[0.2em] px-0 py-4 transition-all hover:text-white flex items-center gap-3"
                            >
                                <ReceiptText size={16} />
                                Histórico de Cobros
                            </TabsTrigger>
                            <TabsTrigger
                                value="metrics"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-blue-100/60 text-[11px] font-black uppercase tracking-[0.2em] px-0 py-4 transition-all hover:text-white flex items-center gap-3"
                            >
                                <PieChart size={16} />
                                Monitor de Consumo
                            </TabsTrigger>
                        </TabsList>

                        <div className="max-w-7xl mx-auto px-0 md:px-0 relative z-20 pb-20">
                            <div className="pt-12 -mt-20 md:mt-12">
                                <TabsContent value="invoices" className="mt-0 focus-visible:ring-0 outline-none space-y-12">
                                    {/* Simulation/Action Card - Floating Surface */}
                                    <div className="group relative bg-white border border-slate-100 p-10 rounded-lg shadow-xl shadow-slate-200/40 overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 -mr-32 -mt-32 rounded-full blur-3xl"></div>

                                        <div className="flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-[#3b60c1]">
                                                        <Activity size={24} className="animate-pulse" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Cierre Mensual</h3>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide leading-relaxed max-w-2xl">
                                                    Generación órdenes de cobro para el periodo <span className="text-[#3b60c1] font-black">{month}/{year}</span>.
                                                    Este proceso audita los empleados activos en cada empresa y aplica las tarifas vigentes.
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-center gap-4 w-full md:w-auto">
                                                <SimulationButton month={month} year={year} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Transactions Table Section */}
                                    <div className="space-y-8 bg-white p-10 rounded-lg border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                                        <div className="flex items-center gap-4">
                                            <div className="h-6 w-1 bg-[#3b60c1] rounded-full"></div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Registro de facturación mensual</h4>
                                        </div>
                                        <InvoicesTable initialInvoices={invoices || []} />
                                    </div>
                                </TabsContent>

                                <TabsContent value="metrics" className="mt-0 focus-visible:ring-0 outline-none">
                                    <div className="space-y-8 bg-white p-10 rounded-lg border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                                        <div className="flex items-center gap-4">
                                            <div className="h-6 w-1 bg-[#3b60c1] rounded-full"></div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Auditoría de Carga por Empresa ({month}/{year})</h4>
                                        </div>
                                        <MetricsTable metrics={metrics || []} />
                                    </div>
                                </TabsContent>
                            </div>
                        </div>
                    </Tabs>
                </div>
            </header>
        </div>
    )
}

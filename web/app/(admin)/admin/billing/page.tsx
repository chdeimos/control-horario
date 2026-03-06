import { getBillingData, getInvoices } from './actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SimulationButton } from './simulation-button'
import { ExportPDFButton } from './export-pdf-button'
import { MetricsTable } from './metrics-table'
import { InvoicesTable } from './invoices-table'
import { CreditCard, TrendingUp, ReceiptText } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function BillingPage({ searchParams }: { searchParams: any }) {
    const params = await searchParams
    const now = new Date()
    const month = params.month ? parseInt(params.month) : now.getMonth() + 1
    const year = params.year ? parseInt(params.year) : now.getFullYear()

    const { data: metrics, error: metricsError } = await getBillingData(month, year)
    const { data: invoices, error: invoicesError } = await getInvoices()

    if (metricsError) return <div className="p-8 text-red-500">Error en métricas: {metricsError}</div>
    if (invoicesError) return <div className="p-8 text-red-500">Error en facturas: {invoicesError}</div>

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <CreditCard className="text-indigo-600" /> Facturación
                    </h2>
                    <p className="text-muted-foreground">Panel de control de ingresos, consumos y facturación mensual.</p>
                </div>
                <div className="flex items-center gap-2">
                    <ExportPDFButton data={metrics || []} month={month} year={year} />
                </div>
            </div>

            <Tabs defaultValue="invoices" className="w-full">
                <TabsList className="bg-slate-100 p-1 border border-slate-200">
                    <TabsTrigger value="invoices" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <ReceiptText className="w-4 h-4 mr-2" />
                        Gestión de Facturas
                    </TabsTrigger>
                    <TabsTrigger value="metrics" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Uso y Métricas
                    </TabsTrigger>
                </TabsList>

                {/* TAB DE FACTURAS */}
                <TabsContent value="invoices" className="mt-6 space-y-6">
                    <div className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
                        <div className="space-y-1">
                            <h3 className="font-semibold text-indigo-900">Acción de Cierre de Mes</h3>
                            <p className="text-sm text-indigo-700/80">Genera oficialmente las facturas pendientes para el periodo seleccionado ({month}/{year}).</p>
                        </div>
                        <SimulationButton month={month} year={year} />
                    </div>

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <ReceiptText className="h-5 w-5 text-indigo-500" />
                                <CardTitle>Historial de Facturas</CardTitle>
                            </div>
                            <CardDescription>Visualiza, gestiona y cambia el estado de cobro de todas las facturas generadas.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <InvoicesTable initialInvoices={invoices || []} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB DE MÉTRICAS */}
                <TabsContent value="metrics" className="mt-6">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-indigo-500" />
                                <CardTitle>Monitor de Consumo Mensual ({month}/{year})</CardTitle>
                            </div>
                            <CardDescription>Cifras de uso en tiempo real que se utilizarán para la próxima factura.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <MetricsTable metrics={metrics || []} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

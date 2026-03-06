import { getGlobalStats } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
    const stats: any = await getGlobalStats()

    if (stats.error) {
        return <div className="p-8 text-red-500">Error: {stats.error}</div>
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Global</h2>
                <p className="text-muted-foreground">Visión general del estado de la plataforma SaaS.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="p-6 bg-white rounded-lg shadow-sm border">
                    <h3 className="text-sm font-medium text-muted-foreground">Total Empresas</h3>
                    <div className="text-2xl font-bold mt-2">{stats.companies}</div>
                </div>
                <div className="p-6 bg-white rounded-lg shadow-sm border">
                    <h3 className="text-sm font-medium text-muted-foreground">Usuarios Totales</h3>
                    <div className="text-2xl font-bold mt-2">{stats.users}</div>
                </div>
                <div className="p-6 bg-white rounded-lg shadow-sm border">
                    <h3 className="text-sm font-medium text-muted-foreground">Ingresos Estimados (Mes)</h3>
                    <div className="text-2xl font-bold mt-2">{stats.revenue} €</div>
                </div>
            </div>

            <div className="p-12 text-center border-2 border-dashed rounded-lg text-muted-foreground bg-slate-50">
                Gráficos de actividad próximamente...
            </div>
        </div>
    )
}

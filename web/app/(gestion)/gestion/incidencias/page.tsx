import { getIncidents } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { IncidentsTable } from './incidents-table'
import { getDepartments } from '../actions'

export default async function IncidentsPage({
    searchParams: searchParamsPromise,
}: {
    searchParams: Promise<{ search?: string; from?: string; to?: string; page?: string; pageSize?: string; department?: string; audited?: string }>
}) {
    const searchParams = await searchParamsPromise
    const departments = await getDepartments()

    const page = parseInt(searchParams.page || '1')
    const pageSize = searchParams.pageSize === 'all' ? 'all' : parseInt(searchParams.pageSize || '25')

    const res = await getIncidents({
        search: searchParams.search,
        from: searchParams.from,
        to: searchParams.to,
        department: searchParams.department,
        audited: searchParams.audited || 'no',
        page,
        pageSize: pageSize as any
    })

    if (res.error) {
        return (
            <div className="p-8 text-center bg-white rounded-lg border border-red-200">
                <h2 className="text-xl font-bold text-red-600">Error</h2>
                <p className="text-muted-foreground">{res.error}</p>
            </div>
        )
    }

    const incidents = res.incidents || []
    const count = res.count || 0
    const pendingCount = (res as any).pendingCount || 0

    return (
        <div className="animate-in fade-in duration-700 min-h-screen bg-[#f3f4f9] md:-m-12">
            {/* PandoraSoft Style Header Header */}
            <header className="bg-[#3b60c1] pt-16 pb-24 px-10 relative overflow-hidden">
                {/* Abstract Background Detail */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
                                Incidencias
                            </h2>
                            <p className="text-blue-100/80 text-base font-medium max-w-lg">
                                Supervisión y resolución de anomalías temporales, omisiones de fichaje y discrepancias en el registro de actividad para asegurar la integridad de los datos.
                            </p>
                        </div>
                        <div className="flex items-center gap-6 px-8 py-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
                            <div className="h-12 w-12 bg-white rounded-xl shadow-lg flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-[#3b60c1]" strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100/60 mb-1">Pendientes de auditar</p>
                                <p className="text-2xl font-black text-white tracking-tight tabular-nums italic">{pendingCount}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-10 -mt-12 relative z-20 space-y-12 pb-20">

                <IncidentsTable
                    initialIncidents={incidents}
                    totalCount={count}
                    departments={departments || []}
                />
            </div>
        </div>
    )
}

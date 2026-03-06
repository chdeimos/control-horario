import { getIncidents } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { IncidentsTable } from './incidents-table'
import { getDepartments } from '../actions'

export default async function IncidentsPage({
    searchParams: searchParamsPromise,
}: {
    searchParams: Promise<{ search?: string; from?: string; to?: string; page?: string; pageSize?: string; department?: string }>
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

    return (
        <div className="animate-in fade-in duration-700 space-y-8 md:-m-8">
            {/* PandoraSoft Style Header Header */}
            <header className="bg-[#3b60c1] pt-16 pb-24 px-10 relative overflow-hidden mb-8">
                {/* Abstract Background Detail */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-5 w-1 bg-white rounded-full"></div>
                        <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.4em]">Auditoría de Anomalías de Red</p>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase italic leading-none">
                                Gestión de<br /><span className="text-blue-200">Incidencias</span>
                            </h2>
                            <p className="text-blue-100/60 mt-4 text-[10px] font-bold uppercase tracking-widest max-w-lg leading-relaxed">
                                Supervisión y resolución de anomalías temporales, omisiones de fichaje y discrepancias en el registro de actividad.
                            </p>
                        </div>
                        <div className="flex items-center gap-6 px-8 py-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
                            <div className="h-12 w-12 bg-white rounded-xl shadow-lg flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-[#3b60c1]" strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100/60 mb-1">Registros Modificados</p>
                                <p className="text-2xl font-black text-white tracking-tight tabular-nums italic">{count}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-10 pb-12">
                <IncidentsTable
                    initialIncidents={incidents}
                    totalCount={count || 0}
                    departments={departments || []}
                />
            </div>
        </div>
    )
}

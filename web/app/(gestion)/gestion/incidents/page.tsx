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
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Incidencias</h1>
                    <p className="text-muted-foreground">Manual de auditoría de registros modificados.</p>
                </div>
                <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 px-3 py-1 text-sm font-medium">
                    {count} Registros Modificados
                </Badge>
            </div>

            <Card>
                <CardHeader className="bg-amber-50/50">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <CardTitle>Historial de Correcciones Manuales</CardTitle>
                    </div>
                    <CardDescription>
                        Todos estos registros han sido modificados por un administrador. Es obligatorio proporcionar un motivo legal para cada cambio.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <IncidentsTable
                        initialIncidents={incidents}
                        totalCount={count}
                        departments={departments}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

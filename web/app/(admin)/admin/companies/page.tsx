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

export const dynamic = 'force-dynamic'

export default async function AdminCompaniesPage() {
    const { data: companies, error } = await getCompanies()
    const { data: plans } = await getPlans()

    if (error) {
        return <div className="p-8 text-red-500">Error al cargar empresas: {error}</div>
    }

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
                        <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.4em]">Control de Tenants y Licencias</p>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase italic leading-none">
                                Gestión de<br /><span className="text-blue-200">Empresas</span>
                            </h2>
                            <p className="text-blue-100/60 mt-4 text-[10px] font-bold uppercase tracking-widest max-w-lg leading-relaxed">
                                Supervisión técnica de empresas clientes, control de facturación, límites de usuarios y estado de servicio global.
                            </p>
                        </div>
                        <AddCompanyDialog plans={plans || []} />
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-10 pb-12">

                <div className="rounded-md border bg-white shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>CIF</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Usuarios</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {companies?.map((company: any) => (
                                <TableRow key={company.id}>
                                    <TableCell className="font-medium">{company.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{company.cif}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {company.plans?.name || 'basic'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-bold">{company.active_users}</span>
                                        <span className="text-muted-foreground ml-1">activos</span>
                                    </TableCell>
                                    <TableCell>
                                        {company.is_active ? (
                                            <Badge className="bg-green-500 hover:bg-green-600">Activo</Badge>
                                        ) : (
                                            <Badge variant="destructive">Suspendido</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <AddAdminDialog companyId={company.id} companyName={company.name} />
                                        <EditCompanyDialog company={company} plans={plans || []} />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {companies?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No hay empresas registradas.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}

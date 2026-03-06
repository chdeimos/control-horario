import { getPlans } from './actions'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Users, Trash2 } from "lucide-react"
import { AddPlanDialog } from './add-plan-dialog'
import { DiscountList } from './discount-list'
import { DeletePlanDialog } from './delete-plan-dialog'
import { EditPlanDialog } from './edit-plan-dialog'

export const dynamic = 'force-dynamic'

export default async function PlansPage() {
    const { data: plans, error } = await getPlans()

    if (error) return <div className="p-8 text-red-500">Error: {error}</div>

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Planes y Precios</h2>
                    <p className="text-muted-foreground">Gestiona los modelos de negocio y tarifas del sistema.</p>
                </div>
                <AddPlanDialog />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {plans?.map((plan: any) => (
                    <Card key={plan.id} className="relative overflow-hidden flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-xl capitalize">{plan.name}</CardTitle>
                                        <Badge variant={plan.billing_type === 'fixed' ? 'default' : 'secondary'}>
                                            {plan.billing_type === 'fixed' ? 'Tarifa Plana' : 'Por Usuario'}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        {plan.billing_type === 'fixed'
                                            ? `Hasta ${plan.fixed_users_limit} usuarios activos`
                                            : 'Precio dinámico por usuario'}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-1 text-slate-400">
                                    <EditPlanDialog plan={plan} />
                                    <DeletePlanDialog plan={plan} allPlans={plans} />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 flex-grow">
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold">
                                    {plan.billing_type === 'fixed' ? plan.fixed_price : plan.price_per_user}€
                                </span>
                                <span className="text-muted-foreground text-sm">
                                    /{plan.billing_type === 'fixed' ? 'mes' : 'usuario/mes'}
                                </span>
                            </div>

                            {plan.billing_type === 'per_user' && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-slate-700">Descuentos por Volumen</h4>
                                    <DiscountList planId={plan.id} discounts={plan.volume_discounts || []} />
                                </div>
                            )}

                            {plan.billing_type === 'fixed' && plan.price_per_user > 0 && (
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Overage</p>
                                    <p className="text-sm text-slate-700">
                                        {plan.price_per_user}€ por usuario extra/mes
                                    </p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 border-t py-3 flex justify-between items-center">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Users className="h-3.5 w-3.5" />
                                <span>{plan.companies_count} empresas</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-mono">
                                ID: {plan.id.slice(0, 8)}
                            </Badge>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}

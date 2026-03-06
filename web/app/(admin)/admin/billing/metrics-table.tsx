'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Metric {
    id: string
    peak_active_users: number
    companies: {
        name: string
        plans: {
            name: string
            billing_type: 'per_user' | 'fixed'
            price_per_user: number
            fixed_price: number
            fixed_users_limit: number
            volume_discounts: any[]
        } | null
    } | null
}

export function MetricsTable({ metrics }: { metrics: Metric[] }) {
    function calculateTotal(peakUsers: number, plan: any) {
        if (!plan) return 0

        if (plan.billing_type === 'fixed') {
            const base = Number(plan.fixed_price) || 0
            const limit = plan.fixed_users_limit || 0
            const overagePrice = Number(plan.price_per_user) || 0
            let total = base
            if (peakUsers > limit) {
                total += (peakUsers - limit) * overagePrice
            }
            return total
        }

        const price = Number(plan.price_per_user) || 0
        const discounts = plan.volume_discounts || []
        const applicableDiscount = discounts
            .filter((d: any) => peakUsers >= d.min_users)
            .sort((a: any, b: any) => b.min_users - a.min_users)[0]

        const discountPerc = applicableDiscount ? Number(applicableDiscount.discount_percentage) : 0
        return (peakUsers * price) * (1 - (discountPerc / 100))
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-center">Usuarios Pico</TableHead>
                    <TableHead>Precio/Base</TableHead>
                    <TableHead className="text-right">Total Estimado</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {metrics?.map((m) => {
                    const total = calculateTotal(m.peak_active_users, m.companies?.plans)
                    return (
                        <TableRow key={m.id}>
                            <TableCell className="font-medium text-slate-700">{m.companies?.name}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className="capitalize bg-slate-50 border-slate-200">
                                    {m.companies?.plans?.name || 'standard'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-center font-bold text-slate-900">{m.peak_active_users}</TableCell>
                            <TableCell className="text-slate-600">
                                {m.companies?.plans?.billing_type === 'fixed'
                                    ? `${m.companies?.plans?.fixed_price}€ (fijo)`
                                    : `${m.companies?.plans?.price_per_user || 0}€/u`}
                            </TableCell>
                            <TableCell className="text-right text-indigo-600 font-bold">
                                {total.toFixed(2)}€
                            </TableCell>
                        </TableRow>
                    )
                })}
                {(!metrics || metrics.length === 0) && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                            No hay métricas registradas para este periodo.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}

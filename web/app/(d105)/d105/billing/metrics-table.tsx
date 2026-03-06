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
import { Building2, Layers, TrendingUp, ShieldCheck, ShieldAlert, ReceiptText } from 'lucide-react'

interface Metric {
    id: string
    peak_active_users: number
    companies: {
        name: string
        plans: any | any[] | null
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
        <div className="overflow-x-auto no-scrollbar -mx-10 px-10">
            <Table className="w-full min-w-[900px]">
                <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-b border-slate-100/50 hover:bg-transparent">
                        <TableHead className="w-[300px] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6 pl-0">Empresa</TableHead>
                        <TableHead className="w-[180px] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">plan</TableHead>
                        <TableHead className="w-[150px] text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">Máximos usuarios</TableHead>
                        <TableHead className="w-[200px] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">Tarifa Base</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6 pr-0">Proyección Mensual</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {metrics?.map((m) => {
                        const plan = Array.isArray(m.companies?.plans) ? m.companies?.plans[0] : m.companies?.plans
                        const total = calculateTotal(m.peak_active_users, plan)
                        const isLive = m.id.startsWith('live-')

                        return (
                            <TableRow key={m.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-all group">
                                <TableCell className="py-8 pl-0">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 border rounded-lg flex items-center justify-center transition-all shadow-sm ${isLive
                                            ? 'bg-blue-50 border-blue-100 text-[#3b60c1] group-hover:bg-[#3b60c1] group-hover:text-white'
                                            : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
                                            }`}>
                                            <Building2 size={18} />
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-slate-900 uppercase tracking-tighter leading-none group-hover:text-[#3b60c1] transition-colors">{m.companies?.name}</p>
                                            {isLive && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse`}></div>
                                                    <span className={`text-[8px] font-black uppercase tracking-widest text-emerald-600`}>
                                                        Monitorización en tiempo real
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="py-8">
                                    <div className="flex items-center gap-2">
                                        <Layers size={14} className="text-slate-300" />
                                        <Badge variant="outline" className="rounded-lg border-slate-200 bg-white text-slate-600 text-[9px] font-black uppercase tracking-widest px-3 py-1 group-hover:border-[#3b60c1] group-hover:text-[#3b60c1] transition-all">
                                            {plan?.name || 'ESTÁNDAR'}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center py-8">
                                    <div className="flex flex-col items-center">
                                        <span className="text-lg font-black text-slate-900 tabular-nums">{m.peak_active_users}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                            {plan?.billing_type === 'fixed'
                                                ? `${plan?.fixed_price}€ FIJO`
                                                : `${plan?.price_per_user || 0}€ / por usuario`
                                            }
                                        </p>
                                        {plan?.billing_type !== 'fixed' && (() => {
                                            const peakUsers = m.peak_active_users
                                            const discounts = plan?.volume_discounts || []
                                            const disc = discounts
                                                .filter((d: any) => peakUsers >= d.min_users)
                                                .sort((a: any, b: any) => b.min_users - a.min_users)[0]

                                            if (disc) {
                                                return (
                                                    <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 flex items-center gap-1 w-fit">
                                                        <ShieldCheck size={10} />
                                                        -{disc.discount_percentage}% VOLUMEN
                                                    </span>
                                                )
                                            }
                                            return null
                                        })()}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right py-8 pr-0">
                                    <div className="flex flex-col items-end">
                                        <span className="text-xl font-black text-[#3b60c1] tabular-nums tracking-tighter">
                                            {total.toFixed(2)}€
                                        </span>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                    {(!metrics || metrics.length === 0) && (
                        <TableRow className="hover:bg-transparent border-0">
                            <TableCell colSpan={5} className="h-60 text-center bg-slate-50/20">
                                <div className="flex flex-col items-center justify-center gap-4">
                                    <div className="w-16 h-16 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-200">
                                        <ReceiptText size={24} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Cero métricas detectadas para este ciclo.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

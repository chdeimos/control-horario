'use client'

import { useState, useMemo, useEffect } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    Trash2,
    CheckCircle2,
    Clock,
    Download,
    Loader2,
    Building2,
    Calendar,
    MoreHorizontal,
    Settings2,
    ArrowUpDown,
    ReceiptText
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner'
import { updateInvoiceStatus, deleteInvoice } from './actions'
import { generateBillingPDF } from '@/lib/pdf-generator'

interface Invoice {
    id: string
    company_id: string
    month: number
    year: number
    amount: number
    status: 'pending' | 'paid'
    details: any
    created_at: string
    companies: {
        name: string
        email: string | null
        phone: string | null
        cif: string | null
    } | null
}

export function InvoicesTable({ initialInvoices }: { initialInvoices: Invoice[] }) {
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('pending')
    const [filter, setFilter] = useState('')
    const [invoices, setInvoices] = useState(initialInvoices)
    const [isPending, setIsPending] = useState(false)

    useEffect(() => {
        setInvoices(initialInvoices)
    }, [initialInvoices])

    const [deleteOpen, setDeleteOpen] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

    const filteredInvoices = useMemo(() => {
        let items = invoices
        if (statusFilter !== 'all') {
            items = items.filter(inv => inv.status === statusFilter)
        }
        if (filter) {
            const lowerFilter = filter.toLowerCase()
            items = items.filter(inv =>
                inv.companies?.name?.toLowerCase().includes(lowerFilter) ||
                `${inv.month}/${inv.year}`.includes(lowerFilter)
            )
        }
        return items
    }, [invoices, filter, statusFilter])

    const handleUpdateStatus = async (invoiceId: string, newStatus: string) => {
        const result = await updateInvoiceStatus(invoiceId, newStatus)
        if (result.success) {
            setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: newStatus as any } : inv))
            toast.success('Estado actualizado correctamente')
        } else {
            toast.error(`Error: ${result.error}`)
        }
    }

    const handleDeleteClick = (invoice: Invoice) => {
        setSelectedInvoice(invoice)
        setDeleteOpen(true)
    }

    const confirmDelete = async () => {
        if (!selectedInvoice) return
        setIsPending(true)
        const result = await deleteInvoice(selectedInvoice.id)
        setIsPending(false)
        setDeleteOpen(false)
        if (result.success) {
            setInvoices(prev => prev.filter(inv => inv.id !== selectedInvoice.id))
            toast.success('Factura eliminada correctamente')
        } else {
            toast.error(`Error: ${result.error}`)
        }
    }

    const handleDownloadIndividual = (inv: Invoice) => {
        const mockMetric = [{
            peak_active_users: inv.details?.peak_users || 0,
            companies: {
                name: inv.companies?.name || 'Empresa',
                plans: {
                    name: inv.details?.plan_name || 'Standard',
                    billing_type: inv.details?.billing_type || 'per_user',
                    price_per_user: inv.details?.overage_price_per_user || inv.details?.base_price || 0,
                    fixed_price: inv.details?.base_price || 0,
                    fixed_users_limit: inv.details?.users_limit || 0,
                    volume_discounts: inv.details?.discount_percentage ? [{ min_users: 0, discount_percentage: inv.details.discount_percentage }] : []
                }
            }
        }]
        generateBillingPDF(mockMetric, inv.month, inv.year)
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-1 bg-slate-50 border border-slate-100 rounded-lg">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#3b60c1] transition-colors" />
                    <Input
                        placeholder="BUSCAR TRANSACCIÓN O ENTIDAD..."
                        className="pl-12 h-12 bg-white border-transparent rounded-lg text-[10px] font-black uppercase tracking-[0.2em] focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all placeholder:text-slate-300"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-1 p-1">
                    <StatusFilterButton
                        active={statusFilter === 'all'}
                        onClick={() => setStatusFilter('all')}
                        label="VER TODO"
                    />
                    <StatusFilterButton
                        active={statusFilter === 'pending'}
                        onClick={() => setStatusFilter('pending')}
                        label="PENDIENTES"
                        color="amber"
                    />
                    <StatusFilterButton
                        active={statusFilter === 'paid'}
                        onClick={() => setStatusFilter('paid')}
                        label="PAGADOS"
                        color="emerald"
                    />
                </div>
            </div>

            <div className="overflow-x-auto no-scrollbar -mx-10 px-10">
                <Table className="w-full min-w-[1000px]">
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-b border-slate-100/50 hover:bg-transparent">
                            <TableHead className="w-[300px] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6 pl-0">Empresa</TableHead>
                            <TableHead className="w-[120px] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">Periodo</TableHead>
                            <TableHead className="w-[120px] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">Usuarios</TableHead>
                            <TableHead className="w-[150px] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">Importe Final</TableHead>
                            <TableHead className="w-[180px] text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">Estado de Facturación</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6 pr-0">Comandos</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredInvoices.length === 0 ? (
                            <TableRow className="hover:bg-transparent border-0">
                                <TableCell colSpan={6} className="h-60 text-center bg-slate-50/20">
                                    <div className="flex flex-col items-center justify-center gap-4">
                                        <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-200">
                                            <ReceiptText size={24} />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Cero registros de facturación detectados.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredInvoices.map((inv) => (
                                <TableRow key={inv.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-all group">
                                    <TableCell className="py-8 pl-0">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-[#3b60c1] group-hover:bg-[#3b60c1] group-hover:text-white transition-all shadow-sm">
                                                <Building2 size={18} />
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-slate-900 uppercase tracking-tighter leading-none group-hover:text-[#3b60c1] transition-colors">{inv.companies?.name}</p>
                                                <div className="flex flex-col gap-0.5 mt-1">
                                                    {inv.companies?.email && (
                                                        <p className="text-[11px] font-bold text-slate-400 lowercase tracking-tight">{inv.companies.email}</p>
                                                    )}
                                                    {inv.companies?.phone && (
                                                        <p className="text-[11px] font-bold text-slate-400 tabular-nums tracking-widest">{inv.companies.phone}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-8">
                                        <div className="flex items-center gap-2 text-xs font-black text-slate-500 tabular-nums uppercase">
                                            <Calendar size={14} className="text-slate-300" />
                                            {inv.month}/{inv.year}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-8">
                                        <div className="flex flex-col">
                                            <span className="text-base font-black text-slate-900 tabular-nums">{inv.details?.peak_users || '-'}</span>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Máximos usuarios</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-8">
                                        <span className="text-lg font-black text-[#3b60c1] tabular-nums tracking-tighter">
                                            {inv.amount.toFixed(2)}€
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-8 text-center">
                                        <button
                                            onClick={() => handleUpdateStatus(inv.id, inv.status === 'paid' ? 'pending' : 'paid')}
                                            className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden flex items-center gap-2 mx-auto ${inv.status === 'paid'
                                                ? "text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-600 hover:text-white"
                                                : "text-amber-500 bg-amber-50 border border-amber-100 hover:bg-amber-600 hover:text-white"
                                                }`}
                                        >
                                            {inv.status === 'paid' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                            {inv.status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
                                        </button>
                                    </TableCell>
                                    <TableCell className="py-8 text-right pr-0">
                                        <div className="flex items-center justify-end gap-2 transition-all duration-300">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDownloadIndividual(inv)}
                                                className="h-10 w-10 p-0 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 hover:bg-[#3b60c1] hover:text-white hover:border-[#3b60c1] transition-all"
                                                title="Descargar PDF"
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleUpdateStatus(inv.id, inv.status === 'paid' ? 'pending' : 'paid')}
                                                className={`h-10 w-10 p-0 rounded-lg bg-slate-50 border border-slate-100 transition-all ${inv.status === 'paid' ? 'text-amber-500 hover:bg-amber-500 hover:text-white hover:border-amber-500' : 'text-emerald-500 hover:bg-emerald-500 hover:text-white hover:border-emerald-500'}`}
                                                title={inv.status === 'paid' ? 'Marcar como Pendiente' : 'Marcar como Pagado'}
                                            >
                                                {inv.status === 'paid' ? <Clock className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteClick(inv)}
                                                className="h-10 w-10 p-0 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all"
                                                title="Eliminar Registro"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent className="bg-white border-none rounded-lg shadow-xl shadow-slate-200/40 p-0 overflow-hidden max-w-md animate-in zoom-in-95 duration-300">
                    <div className="h-2 bg-rose-600"></div>
                    <div className="p-10 space-y-8">
                        <AlertDialogHeader className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
                                    <Trash2 size={24} />
                                </div>
                                <AlertDialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                                    Purgar Registro Histórico
                                </AlertDialogTitle>
                            </div>
                            <AlertDialogDescription className="text-slate-500 text-sm font-bold uppercase tracking-wide leading-relaxed">
                                Estas a punto de <span className="text-rose-600 font-black">ELIMINAR DEFINITIVAMENTE</span> el registro de facturación de <span className="text-slate-900 font-extrabold">{selectedInvoice?.companies?.name}</span>.
                                <br /><br />
                                Esta operación purgará la coherencia del histórico financiero.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-3">
                            <AlertDialogCancel disabled={isPending} className="flex-1 bg-slate-50 border-none text-slate-400 hover:text-slate-900 rounded-lg h-14 uppercase text-[10px] font-black tracking-widest transition-all">
                                ABORTAR
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault()
                                    confirmDelete()
                                }}
                                className="flex-1 rounded-lg uppercase text-[10px] font-black tracking-widest h-14 transition-all bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-200/40"
                                disabled={isPending}
                            >
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'CONFIRMAR PURGA'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function StatusFilterButton({ active, onClick, label, color = 'blue' }: { active: boolean, onClick: () => void, label: string, color?: 'blue' | 'amber' | 'emerald' }) {
    const colorClasses = {
        blue: active ? "bg-[#3b60c1] text-white shadow-lg shadow-blue-200" : "bg-white text-slate-400 hover:text-[#3b60c1]",
        amber: active ? "bg-amber-500 text-white shadow-lg shadow-amber-200" : "bg-white text-slate-400 hover:text-amber-500",
        emerald: active ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-white text-slate-400 hover:text-emerald-500"
    }

    return (
        <button
            onClick={onClick}
            className={`px-6 h-10 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${colorClasses[color]}`}
        >
            {label}
        </button>
    )
}

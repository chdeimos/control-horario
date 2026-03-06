'use client'

import { useState, useMemo } from 'react'
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
    MoreHorizontal
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
    } | null
}

export function InvoicesTable({ initialInvoices }: { initialInvoices: Invoice[] }) {
    const [filter, setFilter] = useState('')
    const [invoices, setInvoices] = useState(initialInvoices)
    const [isPending, setIsPending] = useState(false)

    // Delete Confirmation State
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

    const filteredInvoices = useMemo(() => {
        if (!filter) return invoices
        const lowerFilter = filter.toLowerCase()
        return invoices.filter(inv =>
            inv.companies?.name?.toLowerCase().includes(lowerFilter) ||
            `${inv.month}/${inv.year}`.includes(lowerFilter)
        )
    }, [invoices, filter])

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
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Buscar factura por empresa o fecha..."
                        className="pl-9"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-white overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead>Empresa</TableHead>
                            <TableHead>Periodo</TableHead>
                            <TableHead>Usuarios</TableHead>
                            <TableHead>Importe</TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredInvoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-slate-500 italic">
                                    No se encontraron facturas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredInvoices.map((inv) => (
                                <TableRow key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2 text-slate-900 font-semibold">
                                            <Building2 size={16} className="text-slate-400" />
                                            {inv.companies?.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Calendar size={14} className="text-slate-400" />
                                            {inv.month}/{inv.year}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {inv.details?.peak_users || '-'}
                                    </TableCell>
                                    <TableCell className="font-bold text-slate-900">
                                        {inv.amount.toFixed(2)}€
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <button
                                            onClick={() => handleUpdateStatus(inv.id, inv.status === 'paid' ? 'pending' : 'paid')}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 flex items-center gap-1.5 mx-auto ${inv.status === 'paid'
                                                ? "bg-green-100 text-green-700 border border-green-200"
                                                : "bg-amber-100 text-amber-700 border border-amber-200"
                                                }`}
                                        >
                                            {inv.status === 'paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                            {inv.status === 'paid' ? 'Pagado' : 'Pendiente'}
                                        </button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones de Factura</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleDownloadIndividual(inv)}>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Descargar PDF
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleUpdateStatus(inv.id, inv.status === 'paid' ? 'pending' : 'paid')}
                                                >
                                                    {inv.status === 'paid' ? <Clock className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                                    Marcar como {inv.status === 'paid' ? 'Pendiente' : 'Pagado'}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                    onClick={() => handleDeleteClick(inv)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Confirm Delete Dialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar esta factura?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción es irreversible. Se eliminará el registro histórico de la factura de <strong>{selectedInvoice?.companies?.name}</strong> para el periodo <strong>{selectedInvoice?.month}/{selectedInvoice?.year}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                confirmDelete()
                            }}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Eliminar definitivamente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

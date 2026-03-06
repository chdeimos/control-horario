'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateRequestStatus, deleteTimeOffRequest } from "./actions"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Search, X } from "lucide-react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export function AdminRequestsList({ requests }: { requests: any[] }) {
    const router = useRouter()
    const [filter, setFilter] = useState("")
    const [loadingId, setLoadingId] = useState<string | null>(null)

    // Rejection Dialog State
    const [rejectOpen, setRejectOpen] = useState(false)
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
    const [rejectionReason, setRejectionReason] = useState("")

    async function handleStatusChange(id: string, newStatus: 'pending' | 'approved' | 'rejected', note?: string) {
        if (newStatus === 'rejected' && !note) {
            // Open Dialog instead of submitting
            setSelectedRequestId(id)
            setRejectionReason("")
            setRejectOpen(true)
            return
        }

        console.log(`Sending update for ${id} -> ${newStatus}`)
        setLoadingId(id)

        try {
            const res = await updateRequestStatus(id, newStatus, note)
            console.log(`Update Result:`, res)

            if (res?.error) {
                alert(`Error: ${res.error}`)
            } else {
                // Success
                if (rejectOpen) setRejectOpen(false)
            }
        } catch (err) {
            console.error(err)
            alert("Error de conexión o servidor.")
        }

        setLoadingId(null)
        router.refresh()
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de que quieres borrar esta solicitud permanentemente?')) return
        setLoadingId(id)
        const res = await deleteTimeOffRequest(id)
        setLoadingId(null)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Solicitud borrada')
            router.refresh()
        }
    }

    async function confirmRejection() {
        if (!selectedRequestId) return
        if (!rejectionReason.trim()) {
            alert("Por favor, indica un motivo.")
            return
        }
        await handleStatusChange(selectedRequestId, 'rejected', rejectionReason)
    }

    const [sort, setSort] = useState("pending")

    const filteredRequests = requests.filter(req =>
        req.profiles?.full_name?.toLowerCase().includes(filter.toLowerCase()) ||
        req.request_type.toLowerCase().includes(filter.toLowerCase())
    )

    // Sort Logic
    const sortedRequests = [...filteredRequests].sort((a, b) => {
        if (sort === "pending") {
            if (a.status === 'pending' && b.status !== 'pending') return -1
            if (a.status !== 'pending' && b.status === 'pending') return 1
            // Secondary sort by date (oldest first for pending?)
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        }
        if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        return 0
    })

    return (
        <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="text-blue-800">Gestión de Solicitudes</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar empleado..."
                            className="pl-8 bg-white border-blue-200"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <select
                        className="h-10 w-full sm:w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                    >
                        <option value="pending">Pendientes primero</option>
                        <option value="newest">Más recientes</option>
                        <option value="oldest">Más antiguas</option>
                    </select>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {sortedRequests.map(req => (
                        <div key={req.id} className="flex flex-col md:flex-row items-start justify-between bg-white p-4 rounded-lg shadow-sm gap-4 border border-blue-100">
                            {/* Left: Info */}
                            <div className="flex-1">
                                <p className="font-bold text-lg text-blue-900">{req.profiles?.full_name}</p>
                                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                                    <Badge variant="outline" className="capitalize">
                                        {req.request_type === 'vacation' ? 'Vacaciones' :
                                            req.request_type === 'personal' ? 'Asuntos Propios' :
                                                req.request_type === 'medical' ? 'Baja Médica' : req.request_type}
                                    </Badge>
                                    <span>•</span>
                                    <span>{new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}</span>
                                </div>
                                {req.reason && (
                                    <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-2 rounded italic border-l-2 border-gray-300">
                                        "{req.reason}"
                                    </p>
                                )}
                                {req.status === 'rejected' && req.manager_note && (
                                    <p className="text-sm text-red-600 mt-2 font-medium bg-red-50 p-2 rounded border-l-2 border-red-300">
                                        🛑 Motivo rechazo: "{req.manager_note}"
                                    </p>
                                )}
                            </div>

                            {/* Right: Balances & Status */}
                            <div className="flex flex-col items-end gap-3 min-w-[200px]">
                                {/* Balances */}
                                {req.balances && (
                                    <div className="text-right text-xs space-y-1 bg-blue-50 p-2 rounded w-full">
                                        <div className="flex justify-between gap-4">
                                            <span className="text-gray-600">Vacaciones:</span>
                                            <span className={req.balances.vacation.remaining < 0 ? "text-red-600 font-bold" : "font-medium"}>
                                                {req.balances.vacation.remaining} / {req.balances.vacation.total}
                                            </span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <span className="text-gray-600">Asuntos Propios:</span>
                                            <span className={req.balances.personal.remaining < 0 ? "text-red-600 font-bold" : "font-medium"}>
                                                {req.balances.personal.remaining} / {req.balances.personal.total}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Status & Actions */}
                                <div className="flex items-center gap-2 w-full">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-auto p-0 hover:bg-transparent flex-1 flex justify-end">
                                                <Badge
                                                    className={`cursor-pointer hover:opacity-80 flex items-center gap-2 px-3 py-1.5 text-sm w-full justify-center
                                                        ${req.status === 'approved' ? 'bg-green-600 hover:bg-green-700' :
                                                            req.status === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' :
                                                                'bg-red-600 hover:bg-red-700'}`}
                                                >
                                                    {loadingId === req.id ? '...' : (req.status === 'pending' ? 'Pendiente' : req.status === 'approved' ? 'Aprobada' : 'Rechazada')}
                                                    <ChevronDown className="h-3 w-3" />
                                                </Badge>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'pending')}>
                                                🕒 Pendiente
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'approved')}>
                                                ✅ Aprobar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'rejected')}>
                                                ❌ Rechazar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleDelete(req.id)}
                                        disabled={loadingId === req.id}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {sortedRequests.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                            No se encontraron solicitudes.
                        </div>
                    )}
                </div>
            </CardContent>

            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Motivo del Rechazo</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="reason" className="mb-2 block">
                            Indica por qué rechazas esta solicitud:
                        </Label>
                        <Textarea
                            id="reason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Ej. Necesitamos cubrir el turno..."
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={confirmRejection} disabled={loadingId !== null}>
                            {loadingId ? 'Guardando...' : 'Confirmar Rechazo'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}

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
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { editTimeOffRequest } from './actions'
import { useRouter } from "next/navigation"

export function MyRequestsTable({ requests }: { requests: any[] }) {
    const [editingRequest, setEditingRequest] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleEditSubmit(formData: FormData) {
        setLoading(true)
        const res = await editTimeOffRequest(editingRequest.id, formData)
        setLoading(false)

        if (res?.error) {
            alert(res.error)
        } else {
            setEditingRequest(null)
            router.refresh()
        }
    }

    return (
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Desde</TableHead>
                        <TableHead>Hasta</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.map((req) => (
                        <TableRow key={req.id}>
                            <TableCell className="font-medium capitalize">
                                {req.request_type === 'vacation' && 'Vacaciones'}
                                {req.request_type === 'medical' && 'Baja Médica'}
                                {req.request_type === 'personal' && 'Asuntos Propios'}
                                {req.request_type === 'other' && 'Otro'}
                            </TableCell>
                            <TableCell>{req.start_date}</TableCell>
                            <TableCell>{req.end_date}</TableCell>
                            <TableCell>
                                <div className="flex flex-col items-start gap-1">
                                    <Badge
                                        className={`hover:opacity-80
                                            ${req.status === 'approved' ? 'bg-green-600 hover:bg-green-700' :
                                                req.status === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' :
                                                    'bg-red-600 hover:bg-red-700'}`}
                                    >
                                        {req.status === 'pending' ? 'Pendiente' : req.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                                    </Badge>
                                    {req.status === 'rejected' && req.manager_note && (
                                        <p className="text-xs text-red-600 font-medium bg-red-50 p-1 rounded-lg border border-red-200 mt-1 max-w-[200px] break-words">
                                            🛑 {req.manager_note}
                                        </p>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm truncate max-w-[200px]">{req.reason}</TableCell>
                            <TableCell className="text-right">
                                {req.status === 'pending' && (
                                    <Button variant="ghost" size="sm" onClick={() => setEditingRequest(req)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                    {requests.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                No has solicitado ninguna ausencia.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <Dialog open={!!editingRequest} onOpenChange={(open) => !open && setEditingRequest(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Solicitud</DialogTitle>
                    </DialogHeader>
                    {editingRequest && (
                        <form action={handleEditSubmit} className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Tipo</Label>
                                <Select name="type" required defaultValue={editingRequest.request_type}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Tipo de ausencia" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="vacation">Vacaciones</SelectItem>
                                        <SelectItem value="medical">Baja Médica</SelectItem>
                                        <SelectItem value="personal">Asuntos Propios</SelectItem>
                                        <SelectItem value="other">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Desde</Label>
                                <Input type="date" name="start" required className="col-span-3" defaultValue={editingRequest.start_date} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Hasta</Label>
                                <Input type="date" name="end" required className="col-span-3" defaultValue={editingRequest.end_date} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Motivo</Label>
                                <Textarea name="reason" className="col-span-3" defaultValue={editingRequest.reason || ''} />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateRequestStatus } from "./actions"
import { useRouter } from "next/navigation"

export function PendingRequestsList({ requests }: { requests: any[] }) {
    const router = useRouter()

    async function handleAction(id: string, status: 'approved' | 'rejected') {
        if (!confirm(`¿Estás seguro de ${status === 'approved' ? 'aprobar' : 'rechazar'} esta solicitud?`)) return

        await updateRequestStatus(id, status)
        router.refresh()
    }

    if (!requests || requests.length === 0) return null

    return (
        <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
                <CardTitle className="text-orange-800">Solicitudes Pendientes de Aprobación</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {requests.map(req => (
                        <div key={req.id} className="flex items-center justify-between bg-white p-4 rounded shadow-sm">
                            <div>
                                <p className="font-bold">{req.profiles?.full_name}</p>
                                <p className="text-sm text-gray-600">
                                    {req.request_type} • {req.start_date} a {req.end_date}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleAction(req.id, 'rejected')}>Rechazar</Button>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAction(req.id, 'approved')}>Aprobar</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

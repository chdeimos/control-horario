'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus } from "lucide-react"
import { addDiscount, deleteDiscount } from './actions'

export function DiscountList({ planId, discounts }: { planId: string, discounts: any[] }) {
    const [minUsers, setMinUsers] = useState('')
    const [percentage, setPercentage] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleAdd() {
        if (!minUsers || !percentage) return
        setLoading(true)
        const res = await addDiscount(planId, parseInt(minUsers), parseFloat(percentage))
        setLoading(false)
        if (res.error) {
            alert(res.error)
        } else {
            setMinUsers('')
            setPercentage('')
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Seguro que quieres eliminar este descuento?')) return
        const res = await deleteDiscount(id)
        if (res.error) alert(res.error)
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {discounts.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">Sin descuentos configurados.</p>
                )}
                {discounts.sort((a, b) => a.min_users - b.min_users).map((d) => (
                    <div key={d.id} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100 text-sm">
                        <span>{d.min_users}+ usuarios: <strong>-{d.discount_percentage}%</strong></span>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDelete(d.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>

            <div className="pt-2 border-t space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <Input
                        placeholder="Mín. Usuarios"
                        type="number"
                        value={minUsers}
                        onChange={(e) => setMinUsers(e.target.value)}
                        className="h-8 text-xs"
                    />
                    <Input
                        placeholder="% Descuento"
                        type="number"
                        value={percentage}
                        onChange={(e) => setPercentage(e.target.value)}
                        className="h-8 text-xs"
                    />
                </div>
                <Button
                    className="w-full h-8 text-xs"
                    variant="secondary"
                    onClick={handleAdd}
                    disabled={loading}
                >
                    <Plus className="mr-1 h-3 w-3" />
                    Añadir Tramo
                </Button>
            </div>
        </div>
    )
}

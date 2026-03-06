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
        <div className="space-y-6">
            <div className="space-y-2">
                {discounts.length === 0 && (
                    <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest italic">Aún no se han definido tramos de volumen.</p>
                )}
                {discounts.sort((a, b) => a.min_users - b.min_users).map((d) => (
                    <div key={d.id} className="flex items-center justify-between bg-slate-50/50 border border-slate-100 p-4 rounded-lg group/row transition-all hover:bg-white hover:shadow-md">
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover/row:text-slate-900">
                            +{d.min_users} USUARIOS: <strong className="text-rose-500 font-black ml-2">-{d.discount_percentage}% DESCUENTO</strong>
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            onClick={() => handleDelete(d.id)}
                        >
                            <Trash2 size={14} />
                        </Button>
                    </div>
                ))}
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Input
                            placeholder="MÍN. USUARIOS"
                            type="number"
                            value={minUsers}
                            onChange={(e) => setMinUsers(e.target.value)}
                            className="h-12 bg-slate-50 border-slate-100 rounded-lg text-[10px] font-black uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all placeholder:text-slate-300"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Input
                            placeholder="% DESCUENTO"
                            type="number"
                            value={percentage}
                            onChange={(e) => setPercentage(e.target.value)}
                            className="h-12 bg-slate-50 border-slate-100 rounded-lg text-[10px] font-black uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all placeholder:text-slate-300"
                        />
                    </div>
                </div>
                <Button
                    className="w-full h-12 bg-[#3b60c1] hover:bg-[#2d4a94] text-white shadow-lg shadow-blue-200/50 transition-all rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border-none"
                    onClick={handleAdd}
                    disabled={loading}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir Descuentos por Volumen
                </Button>
            </div>
        </div>
    )
}

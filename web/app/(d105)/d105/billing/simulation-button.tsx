'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Loader2, Sparkles } from 'lucide-react'
import { runMonthlySimulation } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function SimulationButton({ month, year }: { month: number, year: number }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSimulate() {
        setLoading(true)
        const result = await runMonthlySimulation(month, year)
        setLoading(false)

        if (result.success) {
            toast.success(`Protocolo completado: ${result.count} facturas inyectadas en red.`)
            router.refresh()
        } else {
            toast.error(`Error de ejecución: ${result.error}`)
        }
    }

    return (
        <Button
            onClick={handleSimulate}
            disabled={loading}
            className="h-16 px-10 bg-[#3b60c1] hover:bg-[#2d4a94] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95 border-none flex items-center gap-4 relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 w-24 h-full bg-white/10 skew-x-[45deg] translate-x-full group-hover:-translate-x-[250%] transition-transform duration-1000"></div>

            {loading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-200" />
                    <span>Procesando Ciclo...</span>
                </>
            ) : (
                <>
                    <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/20">
                        <Play className="h-4 w-4 fill-white" />
                    </div>
                    <span>Ejecutar Cierre ({month}/{year})</span>
                    <Sparkles size={14} className="text-blue-200 group-hover:rotate-12 transition-transform" />
                </>
            )}
        </Button>
    )
}

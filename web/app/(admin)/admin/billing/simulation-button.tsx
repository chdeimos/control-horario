'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Loader2 } from 'lucide-react'
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
            toast.success(`Simulación completada: se han generado ${result.count} facturas.`)
            router.refresh()
        } else {
            toast.error(`Error: ${result.error}`)
        }
    }

    return (
        <Button
            onClick={handleSimulate}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                </>
            ) : (
                <>
                    <Play className="mr-2 h-4 w-4" />
                    Simular Cierre de Mes ({month}/{year})
                </>
            )}
        </Button>
    )
}

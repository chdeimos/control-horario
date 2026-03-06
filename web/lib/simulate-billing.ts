import { generateMonthlyInvoices } from '@/lib/billing'

export async function simulateBillingRun() {
    console.log('--- INICIANDO SIMULACIÓN DE FACTURACIÓN (Enero 2026) ---')
    try {
        // Simulamos el cierre del mes 1 (Enero) del año 2026
        const results = await generateMonthlyInvoices(1, 2026)

        if (results.length === 0) {
            return { message: 'No había métricas de uso para Enero 2026. No se generaron facturas.' }
        }

        return {
            message: `¡Simulación completada! Se han generado ${results.length} facturas.`,
            details: results
        }
    } catch (error: any) {
        console.error('Error en simulación:', error)
        return { error: error.message }
    }
}

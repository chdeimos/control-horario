import { NextResponse } from 'next/server'
import { processMonthlyReports } from '@/lib/automation-actions'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    // Simple security check
    if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startTime = Date.now()
    try {
        const result = await processMonthlyReports()
        const duration = Date.now() - startTime
        const { logCron } = await import('@/lib/logs')
        await logCron({
            cronName: 'monthly-reports',
            status: 'success',
            resultSummary: `Procesadas ${result?.stats?.companiesProcessed || 0} empresas`,
            durationMs: duration
        })

        return NextResponse.json({
            success: true,
            message: 'Monthly reports processed.',
            result
        })
    } catch (error: any) {
        console.error('[CRON ERROR]', error)
        const duration = Date.now() - startTime
        const { logCron } = await import('@/lib/logs')
        await logCron({
            cronName: 'monthly-reports',
            status: 'error',
            errorDetail: error.message,
            durationMs: duration
        })
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

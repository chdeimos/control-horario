import { NextResponse } from 'next/server'
import { processMonthlyReports } from '@/lib/automation-actions'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    // Simple security check
    if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        await processMonthlyReports()
        return NextResponse.json({ success: true, message: 'Monthly reports processed and sent.' })
    } catch (error: any) {
        console.error('[CRON ERROR]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

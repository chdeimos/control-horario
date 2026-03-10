import { NextResponse } from 'next/server'
import { checkAndNotifyMissingClocks } from '@/lib/notifications'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    // Simple security
    if (key !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startTime = Date.now()
    try {
        await checkAndNotifyMissingClocks()
        const duration = Date.now() - startTime
        const { logCron } = await import('@/lib/logs')
        await logCron({
            cronName: 'daily-notifications',
            status: 'success',
            durationMs: duration
        })
        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('[Cron Notification Error]:', error)
        const duration = Date.now() - startTime
        const { logCron } = await import('@/lib/logs')
        await logCron({
            cronName: 'daily-notifications',
            status: 'error',
            errorDetail: error.message,
            durationMs: duration
        })
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

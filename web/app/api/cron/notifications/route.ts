import { NextResponse } from 'next/server'
import { checkAndNotifyMissingClocks } from '@/lib/notifications'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    // Simple security
    if (key !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        await checkAndNotifyMissingClocks()
        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('[Cron Notification Error]:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

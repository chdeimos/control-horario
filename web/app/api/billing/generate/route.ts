import { NextResponse } from 'next/server'
import { generateMonthlyInvoices } from '@/lib/billing'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    // Simple security
    if (key !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    // By default, generate for the PREVIOUS month (since it's May 1st, we bill April)
    let month = now.getMonth() // 0-indexed, so today (Feb) - 1 = Jan
    let year = now.getFullYear()

    if (month === 0) {
        month = 12
        year -= 1
    }

    try {
        const results = await generateMonthlyInvoices(month, year)
        return NextResponse.json({ success: true, generated: results.length })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

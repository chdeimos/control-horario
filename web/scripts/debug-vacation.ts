import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

function getDaysDiff(start: string, end: string) {
    const d1 = new Date(start)
    const d2 = new Date(end)
    const diffTime = Math.abs(d2.getTime() - d1.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

async function debugCalculation() {
    console.log('--- Debugging Vacation Logic ---')
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Fetch all requests
    const { data: requests, error } = await supabase
        .from('time_off_requests')
        .select('*')

    if (error) {
        console.error('Error fetching requests:', error)
        return
    }

    console.log(`Found ${requests.length} total requests.`)

    const userUsage: Record<string, number> = {}

    requests.forEach((req: any) => {
        console.log(`Request ${req.id}: Status=${req.status} Type=${req.request_type} Dates=${req.start_date} to ${req.end_date}`)

        if (req.status === 'approved') {
            const days = getDaysDiff(req.start_date, req.end_date)
            console.log(` -> APPROVED. Duration: ${days} days.`)

            if (['vacation', 'personal'].includes(req.request_type)) {
                userUsage[req.user_id] = (userUsage[req.user_id] || 0) + days
                console.log(` -> Counted! User ${req.user_id} Total Usage: ${userUsage[req.user_id]}`)
            } else {
                console.log(` -> SKIPPED (Type mismatch).`)
            }
        } else {
            console.log(` -> Ignored (Status not approved).`)
        }
    })

    console.log('--- Final Usage ---', userUsage)
}

debugCalculation()

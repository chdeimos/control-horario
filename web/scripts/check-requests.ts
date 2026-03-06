import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function checkRequests() {
    console.log('--- Checking Time Off Requests ---')
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing')

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Check table existence and content
    const { data, error } = await supabase.from('time_off_requests').select('*')

    if (error) {
        console.error('Error fetching time_off_requests:', error)
    } else {
        console.log(`Found ${data.length} requests:`, data)
    }

    // Check profiles to confirm user role
    const { data: users, error: usersError } = await supabase.from('profiles').select('id, full_name, role, company_id')
    if (usersError) {
        console.error('Error fetching profiles:', usersError)
    } else {
        console.log('Users:', users)
    }
}

checkRequests()

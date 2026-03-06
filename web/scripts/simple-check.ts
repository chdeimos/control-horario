
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl || '', supabaseKey || '')

async function debug() {
    const { data: profiles } = await supabase.from('profiles').select('full_name, company_id')
    const { data: entries } = await supabase.from('time_entries').select('company_id').limit(1)

    console.log('--- PROFILE COMP ---')
    console.log(profiles)
    console.log('--- ENTRY COMP ---')
    console.log(entries)
}

debug()

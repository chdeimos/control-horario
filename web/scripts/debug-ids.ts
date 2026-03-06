
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl || '', supabaseKey || '')

async function debug() {
    const { data: profiles } = await supabase.from('profiles').select('full_name, company_id, role, id')
    console.log('Profiles:')
    profiles?.forEach(p => console.log(`${p.full_name}: Company=${p.company_id}, Role=${p.role}, ID=${p.id}`))

    const { data: entries } = await supabase.from('time_entries').select('user_id, company_id, clock_in')
    console.log('\nEntries:')
    entries?.forEach(e => console.log(`UID=${e.user_id}, Company=${e.company_id}, In=${e.clock_in}`))
}

debug()

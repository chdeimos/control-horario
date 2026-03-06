
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl || '', supabaseKey || '')

async function debug() {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name')
    console.log('Profiles:', profiles?.length)

    if (profiles) {
        for (const p of profiles) {
            const { data: entries } = await supabase.from('time_entries').select('*').eq('user_id', p.id)
            console.log(`- ${p.full_name} (${p.id}): ${entries?.length} entries`)
            entries?.forEach(e => {
                console.log(`  [${e.entry_type}] ${e.clock_in} -> ${e.clock_out}`)
            })
        }
    }
}

debug()

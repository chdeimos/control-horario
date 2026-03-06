import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
    const { data: entries } = await supabase.from('time_entries').select('id, is_incident, incident_reason')
    console.log('Entries status:', JSON.stringify(entries, null, 2))
}

run()

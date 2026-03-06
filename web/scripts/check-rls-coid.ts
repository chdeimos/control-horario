
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl || '', supabaseKey || '')

async function checkRLS() {
    console.log('--- REVISIÓN DE COID EN ENTRIES ---')

    const { data: entries } = await supabase.from('time_entries').select('user_id, company_id, clock_in').limit(5)

    if (!entries || entries.length === 0) {
        console.log('No hay fichajes en la tabla.')
        return
    }

    for (const en of entries) {
        const { data: profile } = await supabase.from('profiles').select('full_name, company_id').eq('id', en.user_id).single()
        console.log(`Fichaje de ${profile?.full_name}:`)
        console.log(`  Profile CoID: ${profile?.company_id}`)
        console.log(`  Entry CoID:   ${en.company_id}`)
        if (profile?.company_id !== en.company_id) {
            console.log('  ⚠️ ADVERTENCIA: Los IDs de empresa no coinciden!')
        }
    }
}

checkRLS()


import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl || '', supabaseKey || '')

async function setup() {
    console.log('--- REGENERANDO Fichajes de Prueba con GPS ---')

    const { data: company } = await supabase.from('companies').select('id').limit(1).single()
    if (!company) return

    const { data: profiles } = await supabase.from('profiles').select('id, full_name').neq('role', 'manager')
    if (!profiles) return

    for (const emp of profiles) {
        const today = new Date()

        // Mañana
        const mS = new Date(today); mS.setHours(8, 30, 0, 0)
        const mE = new Date(today); mE.setHours(13, 15, 0, 0)

        console.log(`Insertando para ${emp.full_name}...`)

        const { error: e1 } = await supabase.from('time_entries').insert({
            user_id: emp.id,
            company_id: company.id,
            clock_in: mS.toISOString(),
            clock_out: mE.toISOString(),
            entry_type: 'work',
            origin: 'web',
            gps_lat: 40.4168, // Madrid
            gps_long: -3.7038
        })
        if (e1) console.error('Error 1:', e1.message)

        // Tarde (ACTIVO)
        const aS = new Date(today); aS.setHours(15, 0, 0, 0)
        const { error: e2 } = await supabase.from('time_entries').insert({
            user_id: emp.id,
            company_id: company.id,
            clock_in: aS.toISOString(),
            clock_out: null,
            entry_type: 'work',
            origin: 'web',
            gps_lat: 40.4168,
            gps_long: -3.7038
        })
        if (e2) console.error('Error 2:', e2.message)
    }
}

setup()

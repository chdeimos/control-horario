
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl || '', supabaseKey || '')

async function check() {
    console.log('--- REVISIÓN DE DATOS DEL MANAGER ---')

    // 1. Obtener el Manager
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const managerAuth = authUsers.users.find(u => u.email === 'admin@example.com')

    if (!managerAuth) {
        console.log('No se encuentra admin@example.com en Auth.')
        return
    }

    const { data: managerProfile } = await supabase
        .from('profiles')
        .select('id, full_name, role, company_id')
        .eq('id', managerAuth.id)
        .single()

    console.log('Manager:', managerProfile?.full_name, 'Company:', managerProfile?.company_id)

    // 2. Obtener Empleados de esa misma empresa
    const { data: employees } = await supabase
        .from('profiles')
        .select('id, full_name, company_id')
        .eq('company_id', managerProfile?.company_id)
        .neq('id', managerProfile?.id)

    console.log('\nEmpleados en la misma empresa:', employees?.length)
    employees?.forEach(e => console.log(`- ${e.full_name} (${e.id})`))

    // 3. Revisar fichajes de hoy para esos empleados
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()

    console.log(`\nBuscando fichajes entre ${start} y ${end}`)

    if (employees && employees.length > 0) {
        for (const emp of employees) {
            const { data: entries } = await supabase
                .from('time_entries')
                .select('*')
                .eq('user_id', emp.id)
                .gte('clock_in', start)
                .lte('clock_in', end)

            console.log(`- Fichajes para ${emp.full_name}:`, entries?.length)
            entries?.forEach(en => {
                console.log(`  [${en.entry_type}] In: ${en.clock_in} Out: ${en.clock_out} CoID: ${en.company_id}`)
            })
        }
    }
}

check()

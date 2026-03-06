
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl || '', supabaseKey || '')

async function check() {
    const { data: companies, error } = await supabase.from('companies').select('id, name, settings')
    if (error) {
        console.error('Error:', error.message)
        return
    }

    console.log('--- COMPANY SETTINGS ---')
    companies.forEach(c => {
        console.log(`Company: ${c.name} (${c.id})`)
        console.log('Settings:', JSON.stringify(c.settings, null, 2))
        console.log('------------------------')
    })
}

check()

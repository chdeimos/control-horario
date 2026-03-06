
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProfiles() {
    const { data, error } = await supabase.from('profiles').select('*')
    if (error) {
        console.error('Error fetching profiles:', error)
    } else {
        console.log('Profiles found:', data.length)
        data.forEach(p => {
            console.log(`- ID: ${p.id}, Name: ${p.full_name}, Role: ${p.role}, CompanyID: ${p.company_id}, Status: ${p.status}, Dept: ${p.department_id}`)
        })
    }
}

checkProfiles()

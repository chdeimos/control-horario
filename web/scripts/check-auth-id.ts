
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl || '', supabaseKey || '')

async function debug() {
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const u = users.find(x => x.email === 'admin@example.com')
    console.log('Auth ID for admin@example.com:', u?.id)

    const { data: p } = await supabase.from('profiles').select('*').eq('id', u?.id).single()
    console.log('Profile for that ID:', p)

    const { data: allP } = await supabase.from('profiles').select('id, full_name, company_id')
    console.log('\nAll Profiles:')
    console.log(allP)
}

debug()

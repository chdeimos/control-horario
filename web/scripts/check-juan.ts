
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl || '', supabaseKey || '')

async function check() {
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const u = users.find(x => x.email === 'juan@demo.com')
    console.log('User JUAN:', u?.id)

    if (u) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single()
        console.log('Profile JUAN:', p)
    }
}

check()

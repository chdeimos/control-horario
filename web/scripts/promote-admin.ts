
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl || '', supabaseKey || '')

async function promote() {
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const u = users.find(x => x.email === 'admin@example.com')

    if (u) {
        const { error } = await supabase
            .from('profiles')
            .update({ role: 'super_admin' })
            .eq('id', u.id)

        if (error) {
            console.error('Error al actualizar el perfil:', error.message)
        } else {
            console.log('--- ADMIN PROMOTED ---')
            console.log(`El usuario ${u.email} ahora tiene el rol: super_admin`)
        }
    } else {
        console.error('No se encontró el usuario admin@example.com')
    }
}

promote()

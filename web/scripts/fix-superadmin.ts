import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Faltan variables de entorno.')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function restoreSuperAdmin() {
    const targetEmail = process.argv[2] || 'david.falcon@pandorasoft.com'

    if (!targetEmail) {
        console.error('Debes proporcionar un email. Ejemplo: npx tsx scripts/fix-superadmin.ts usuario@empresa.com')
        return
    }

    // Buscar en Auth Users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()

    if (authError || !users) {
        console.error('No se pudo listar usuarios:', authError?.message)
        return
    }

    const saUser = users.find(u => u.email === targetEmail)

    if (!saUser) {
        console.error(`No existe el usuario ${targetEmail}. Correos existentes:`)
        console.table(users.map(u => ({ email: u.email })))
        return
    }

    // Actualizar el perfil rebajado
    const { error: resetError } = await supabase.from('profiles').update({
        role: 'super_admin',
        company_id: null,
        department_id: null,
        status: 'active'
    }).eq('id', saUser.id)

    if (resetError) {
        console.error('Error restaurando el rol al usuario:', resetError.message)
    } else {
        console.log(`✓ Super Admin con email ${targetEmail} RESTAURADO y desvinculado de empresas.`)
    }
}

restoreSuperAdmin()

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateEmail() {
    console.log('--- Buscando admin@example.com ---')

    // 1. Encontrar el usuario
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    if (error) {
        console.error('Error al listar usuarios:', error.message)
        return
    }

    const adminUser = users.find(u => u.email === 'admin@example.com')
    if (!adminUser) {
        console.log('No se encontró el usuario admin@example.com en la base de datos de Auth.')
        return
    }

    console.log(`Usuario encontrado con ID: ${adminUser.id}`)
    console.log('--- Actualizando correo a chdeimos@gmail.com ---')

    // 2. Actualizar correo en Auth y evitar la validación de envío
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        adminUser.id,
        { email: 'chdeimos@gmail.com', email_confirm: true }
    )

    if (updateError) {
        console.error('Error al actualizar correo:', updateError.message)
        return
    }

    console.log('✓ Correo de Autenticación actualizado correctamente.')

    // 3. (Opcional) Si existe algún correo metido a piñón en la tabla profiles, no importa porque profiles no tiene columna correo, se rige por UUID y por Auth.
    // De todas formas verificamos el nombre del Super Admin.
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', adminUser.id).single()
    if (profile) {
        await supabase.from('profiles').update({ full_name: 'Deimos Administrador' }).eq('id', profile.id)
        console.log('✓ Perfil renombrado correctamente a Deimos Administrador.')
    }

    console.log('\n--- Todo listo ---')
}

updateEmail()

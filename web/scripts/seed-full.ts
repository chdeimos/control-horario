
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setup() {
    console.log('--- Configurando Empresa y Usuarios REALES de Prueba ---')

    // 1. Crear Empresa
    const { data: company, error: cError } = await supabase.from('companies').insert({
        name: 'Empresa Demo',
        cif: 'B' + Math.random().toString().slice(2, 10),
        settings: {
            default_vacation_days: 30,
            default_personal_days: 5
        }
    }).select().single()

    if (cError) {
        console.error('Error empresa:', cError.message)
        return
    }

    // 2. Crear Departamento
    const { data: dept } = await supabase.from('departments').insert({
        company_id: company.id,
        name: 'Operaciones'
    }).select().single()

    // 3. Crear ADMIN JUAN para el usuario
    const { data: juanAuth, error: jError } = await supabase.auth.admin.createUser({
        email: 'juan@demo.com',
        password: 'admin123',
        email_confirm: true
    })

    if (jError && jError.message !== 'Email already exists') {
        console.error('Error juan auth:', jError.message)
    } else {
        const juanId = juanAuth?.user?.id || (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === 'juan@demo.com')?.id
        if (juanId) {
            await supabase.from('profiles').upsert({
                id: juanId,
                company_id: company.id,
                role: 'company_admin',
                full_name: 'Juan Antonio',
                department_id: dept?.id,
                status: 'active',
                pin_code: '7788',
                total_vacation_days: 30,
                total_personal_days: 5
            })
            console.log('✓ Usuario juan@demo.com configurado como Admin Empresa.')
        }
    }

    // 4. Crear o buscar Super Admin (admin@example.com)
    const { data: adminAuth, error: adminErr } = await supabase.auth.admin.createUser({
        email: 'admin@example.com',
        password: 'admin123',
        email_confirm: true
    })

    if (adminErr && adminErr.message !== 'Email already exists') {
        console.error('Error admin auth:', adminErr.message)
    }

    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const adminUser = authUsers.users.find(u => u.email === 'admin@example.com')

    if (adminUser) {
        await supabase.from('profiles').upsert({
            id: adminUser.id,
            company_id: company.id,
            role: 'super_admin',
            full_name: 'Administrador Demo',
            department_id: dept?.id,
            status: 'active'
        })
        console.log('✓ Usuario admin@example.com configurado como Super Admin.')
    }

    // 5. Crear empleados
    const employees = [
        { email: 'sandra@demo.com', name: 'Sandra Corredoira', hours: 8, type: 'work' },
        { email: 'fernando@demo.com', name: 'Fernando de la Rua', hours: 7.5, type: 'work' },
        { email: 'natalia@demo.com', name: 'Natalia Fuentes', hours: 6, type: 'remote_work' }
    ]

    for (const emp of employees) {
        // Crear en Auth
        const { data: authData, error: aError } = await supabase.auth.admin.createUser({
            email: emp.email,
            password: 'password123',
            email_confirm: true
        })

        if (aError && aError.message !== 'Email already exists') {
            console.error(`Error auth para ${emp.name}:`, aError.message)
            continue
        }

        const userId = authData.user?.id || authUsers.users.find(u => u.email === emp.email)?.id

        if (userId) {
            // Crear en Profile
            await supabase.from('profiles').upsert({
                id: userId,
                company_id: company.id,
                full_name: emp.name,
                role: 'employee',
                status: 'active',
                department_id: dept?.id,
                scheduled_hours: emp.hours,
                total_vacation_days: 30,
                total_personal_days: 5
            })
            console.log(`✓ Empleado ${emp.name} creado con éxito.`)
        }
    }

    console.log('\n--- Todo listo ---')
}

setup()

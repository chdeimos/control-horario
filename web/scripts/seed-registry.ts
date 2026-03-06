
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

async function seedTestData() {
    console.log('--- Creando datos de prueba para Registro ---')

    // 1. Obtener la primera empresa disponible
    const { data: companies } = await supabase.from('companies').select('id').limit(1)
    if (!companies || companies.length === 0) {
        console.error('No hay empresas en la base de datos. Crea una primero.')
        return
    }
    const companyId = companies[0].id

    // 2. Crear un departamento
    const { data: dept } = await supabase.from('departments').insert({
        company_id: companyId,
        name: 'Operaciones'
    }).select().single()

    const deptId = dept?.id

    // 3. Crear 3 empleados de prueba (UUIDs aleatorios para el perfil, asumiendo que no hay RLS restrictivo para service role)
    const employees = [
        { name: 'Sandra Corredoira', hours: 5, color: 'work' },
        { name: 'Fernando de la Rua', hours: 7.5, color: 'work' },
        { name: 'Natalia Fuentes', hours: 8, color: 'remote_work' }
    ]

    for (const emp of employees) {
        // Nota: Usamos IDs fijos de prueba o generados. Para que aparezcan sin Auth, los creamos en profiles.
        const fakeId = crypto.randomUUID()

        const { error: pError } = await supabase.from('profiles').insert({
            id: fakeId,
            company_id: companyId,
            full_name: emp.name,
            role: 'employee',
            status: 'active',
            department_id: deptId,
            scheduled_hours: emp.hours
        })

        if (pError) {
            console.error(`Error creando perfil ${emp.name}:`, pError.message)
            continue
        }

        // 4. Crear fichajes para HOY
        const today = new Date()
        today.setHours(9, 0, 0, 0) // Empieza a las 9:00

        // Mañana
        await supabase.from('time_entries').insert({
            user_id: fakeId,
            company_id: companyId,
            clock_in: today.toISOString(),
            clock_out: new Date(today.getTime() + 4 * 60 * 60 * 1000).toISOString(), // 4 horas
            entry_type: emp.color,
            origin: 'web'
        })

        // Pausa
        const breakStart = new Date(today.getTime() + 4 * 60 * 60 * 1000)
        await supabase.from('time_entries').insert({
            user_id: fakeId,
            company_id: companyId,
            clock_in: breakStart.toISOString(),
            clock_out: new Date(breakStart.getTime() + 1 * 60 * 60 * 1000).toISOString(), // 1 hora pausa
            entry_type: 'break',
            origin: 'web'
        })

        // Tarde (Sigue activo)
        const afternoonStart = new Date(breakStart.getTime() + 1 * 60 * 60 * 1000)
        await supabase.from('time_entries').insert({
            user_id: fakeId,
            company_id: companyId,
            clock_in: afternoonStart.toISOString(),
            clock_out: null, // Trabajando actualmente
            entry_type: emp.color,
            origin: 'web'
        })

        console.log(`✓ Datos creados para ${emp.name}`)
    }

    console.log('--- Proceso completado ---')
    console.log('Ahora puedes entrar en /registry y ver las gráficas.')
}

seedTestData()

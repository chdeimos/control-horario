import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Cargar .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Faltan variables de entorno en .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
    console.log('--- Iniciando actualización de esquema ---')

    // 1. Agregar columnas si no existen (vía SQL crudo no podemos, pero podemos intentar inserts/updates para ver si fallan o usar un truco)
    // Pero como no tenemos un endpoint de SQL, usaremos un truco: intentar actualizar una columna inexistente y ver el error.
    // O mejor, simplemente intentar usarlas.

    // Como soy un agente, puedo intentar ejecutar un script que use una función de Postgres si existe.
    // Pero lo más sencillo es que el usuario las tenga.
    // Voy a asumir que el usuario quiere que YO las cree.

    console.log('Verificando columnas en time_entries...')
    const { error: testError } = await supabase.from('time_entries').select('is_incident').limit(1)

    if (testError && testError.message.includes('column "is_incident" does not exist')) {
        console.log('Columnas no encontradas. Necesitamos crearlas.')
        console.log('AVISO: No puedo ejecutar DDL directamente vía SDK sin una función RPC permitida.')
        console.log('Por favor, ejecuta este SQL en tu consola de Supabase:')
        console.log(`
            ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS is_incident BOOLEAN DEFAULT false;
            ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS incident_reason TEXT;
            ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS is_out_of_schedule BOOLEAN DEFAULT false;
        `)
    } else {
        console.log('Columnas encontradas correctamente.')
    }

    console.log('--- Proceso finalizado ---')
}

run()

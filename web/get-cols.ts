import { createAdminClient } from './lib/supabase/admin'
import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const [key, ...value] = line.split('=')
        if (key && value) {
            process.env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1')
        }
    })
}

async function getColumns() {
    const supabase = createAdminClient()
    const { data: userCols } = await supabase.rpc('snapshot_columns', { t_schema: 'auth', t_name: 'users' }).catch(() => ({ data: null }));

    // Actually, since I can't easily add a new RPC just for this, I'll use a direct query via a temporary script that uses the client
    const { data, error } = await supabase.from('information_schema.columns' as any)
        .select('column_name, is_generated')
        .eq('table_schema', 'auth')
        .eq('table_name', 'users')

    console.log('User Columns:', data)
}
getColumns()

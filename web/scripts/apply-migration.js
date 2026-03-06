const postgres = require('postgres')
const fs = require('fs')
const path = require('path')

async function run() {
    console.log('Applying migration...')
    const sql = postgres(process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres')

    const migrationPath = path.join('..', 'supabase', 'migrations', '20240101000007_profiles_update_policy.sql')
    console.log(`Reading: ${migrationPath}`)

    try {
        const content = fs.readFileSync(migrationPath, 'utf8')
        console.log('Running SQL...')
        await sql.unsafe(content)
        console.log('Migration OK!')
    } catch (err) {
        console.error('Migration failed:', err)
    } finally {
        await sql.end()
    }
}

run()

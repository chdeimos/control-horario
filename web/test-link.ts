import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

async function test() {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email: 'test@example.com',
        options: {
            redirectTo: 'https://test.com/auth/callback'
        }
    })
    console.log("Error:", error)
    console.log("Data:", JSON.stringify(data, null, 2))
}
test()

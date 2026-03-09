import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function run() {
    const siteUrl = "https://horario.pandorasoft.com.es";
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: 'chdeimos@gmail.com',
        options: {
            redirectTo: `${siteUrl}/auth/callback?next=/set-password`,
        }
    });

    if (error) {
        console.log("Error:", error);
    } else if (data) {
        console.log("Action Link original que devuelve la BBDD:");
        console.log(data.properties.action_link);
    }
}
run();

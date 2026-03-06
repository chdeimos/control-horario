
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkUsers() {
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, schedule_type, status, scheduled_hours')
        .in('full_name', ['Carmen', 'Pedro', 'Administrador']);

    if (error) {
        console.error(error);
        return;
    }

    for (const profile of profiles) {
        console.log(`\n--- ${profile.full_name} ---`);
        console.log(`ID: ${profile.id}`);
        console.log(`Type: ${profile.schedule_type}`);
        console.log(`Sched Hours: ${profile.scheduled_hours}`);

        const { data: schedules } = await supabase
            .from('work_schedules')
            .select('*')
            .eq('profile_id', profile.id);

        console.log('Schedules:', schedules);

        const { data: entries } = await supabase
            .from('time_entries')
            .select('*')
            .eq('user_id', profile.id)
            .gte('clock_in', '2026-02-14T00:00:00')
            .lte('clock_in', '2026-02-14T23:59:59');

        console.log('Entries Today:', entries);
    }
}

checkUsers();

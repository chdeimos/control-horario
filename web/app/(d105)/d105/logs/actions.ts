'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getAccessLogs() {
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('access_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

    if (error) throw new Error(error.message)
    return data
}

export async function getAdminAccessLogs() {
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('admin_access_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

    if (error) throw new Error(error.message)
    return data
}

export async function getCronLogs() {
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('cron_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

    if (error) throw new Error(error.message)
    return data
}

export async function getEmailLogs() {
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

    if (error) throw new Error(error.message)
    return data
}

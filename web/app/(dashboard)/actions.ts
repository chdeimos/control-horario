'use server'

import { createClient } from '@/lib/supabase/server'

export async function getDepartments() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

    if (!profile) return []

    const { data: departments } = await supabase
        .from('departments')
        .select('id, name')
        .eq('company_id', profile.company_id)
        .order('name', { ascending: true })

    return departments || []
}

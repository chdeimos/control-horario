'use server'

import { createClient } from '@/lib/supabase/server'

export async function getMonthlyReportData(userId: string, month: number, year: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    // Check permissions: Admin or Self
    const { data: requester } = await supabase.from('profiles').select('role, company_id, department_id').eq('id', user.id).single()
    const isAdmin = ['company_admin', 'manager'].includes(requester?.role)

    if (!isAdmin && userId !== user.id) {
        return { error: 'No tienes permiso para ver este informe.' }
    }

    // Get Employee & Company Info
    const { data: employeeData, error: empError } = await supabase
        .from('profiles')
        .select('full_name, nif, company_id, department_id')
        .eq('id', userId)
        .single()

    if (empError || !employeeData) return { error: 'Empleado no encontrado' }

    // If manager, check department restriction
    if (requester?.role === 'manager' && userId !== user.id) {
        if (employeeData.department_id !== requester?.department_id) {
            return { error: 'No tienes permiso para ver informes fuera de tu departamento.' }
        }
    }

    const { data: companyData, error: compError } = await supabase
        .from('companies')
        .select('name, cif')
        .eq('id', employeeData.company_id)
        .single()

    if (compError || !companyData) return { error: 'Empresa no encontrada' }

    // Get Time Entries for the month
    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString() // Last day of month

    const { data: entries, error: entriesError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('clock_in', startDate)
        .lte('clock_in', endDate)
        .order('clock_in', { ascending: true })

    if (entriesError) return { error: entriesError.message }

    return {
        employee: employeeData,
        company: companyData,
        entries: entries || []
    }
}

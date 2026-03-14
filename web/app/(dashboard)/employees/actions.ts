'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { getSiteUrl } from '@/lib/get-site-url'

async function checkPlanLimit(companyId: string) {
    const supabase = await createClient()
    const { data: company } = await supabase
        .from('companies')
        .select('*, plans(*)')
        .eq('id', companyId)
        .single()

    if (company?.plans?.billing_type === 'fixed') {
        const limit = company.plans.fixed_users_limit
        const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .eq('status', 'active')

        if (count && count >= limit) {
            return { limited: true, limit }
        }
    }
    return { limited: false }
}

export async function inviteEmployee(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check Admin
    const { data: adminProfile } = await supabase.from('profiles').select('role, company_id, department_id').eq('id', user!.id).single()
    if (!adminProfile || !['company_admin', 'manager'].includes(adminProfile.role)) {
        return { error: 'No tienes permisos.' }
    }

    // Check Plan Limit
    const limitCheck = await checkPlanLimit(adminProfile.company_id)
    if (limitCheck.limited) {
        return { error: `Has alcanzado el límite de ${limitCheck.limit} usuarios activos de tu plan Tarifa Plana. Desactiva algún usuario para añadir uno nuevo.` }
    }

    const email = String(formData.get('email'))
    const fullName = String(formData.get('full_name'))
    const role = String(formData.get('role')) || 'employee'
    const nif = String(formData.get('nif')) || null
    const phone = String(formData.get('phone')) || null
    const ssn = String(formData.get('social_security_number')) || null
    const jobTitle = String(formData.get('job_title')) || null
    let departmentId = String(formData.get('department_id')) || null
    const scheduledHours = parseFloat(String(formData.get('scheduled_hours'))) || 8.0
    const pin = String(formData.get('pin_code')) || null
    const totalVacation = parseInt(String(formData.get('total_vacation_days'))) || 22
    const totalPersonal = parseInt(String(formData.get('total_personal_days'))) || 0

    // If manager, enforce THEIR department
    if (adminProfile.role === 'manager') {
        if (!adminProfile.department_id) {
            return { error: 'Como manager, debes tener un departamento asignado para invitar empleados.' }
        }
        departmentId = adminProfile.department_id
    }

    // PIN Code Validation (Security RPC)
    if (pin && pin.trim().length > 0) {
        if (!/^\d{4}$/.test(pin)) {
            return { error: 'El código PIN debe tener exactamente 4 dígitos numéricos.' }
        }

        const { data: pinExists, error: pinCheckError } = await supabase.rpc('check_pin_exists_in_company', {
            p_company_id: adminProfile.company_id,
            p_exclude_user_id: null,
            p_pin: pin
        })

        if (pinCheckError) return { error: `Error validando PIN: ${pinCheckError.message}` }
        if (pinExists) {
            return { error: 'Este código PIN ya está asignado a otro empleado de tu empresa.' }
        }
    }

    const supabaseAdmin = createAdminClient()
    const siteUrl = await getSiteUrl()

    // 1. Invite User
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email: email,
        options: {
            redirectTo: `${siteUrl}/api/auth/callback?next=/set-password`
        }
    })

    if (inviteError) {
        return { error: `Error invitando usuario: ${inviteError.message}` }
    }

    const newUserId = inviteData.user.id

    // 2. Create Profile
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
        id: newUserId,
        company_id: adminProfile.company_id,
        role: role,
        full_name: fullName,
        nif: nif,
        phone: phone,
        social_security_number: ssn,
        department: jobTitle,
        department_id: departmentId,
        scheduled_hours: scheduledHours,
        total_vacation_days: totalVacation,
        total_personal_days: totalPersonal,
        status: 'active'
    })

    if (profileError) {
        return { error: `Usuario invitado pero error al crear perfil: ${profileError.message}` }
    }

    // 3. Save PIN Hash if provided
    if (pin && pin.trim().length > 0) {
        const { error: pinHashError } = await supabaseAdmin.rpc('update_employee_pin', {
            p_user_id: newUserId,
            p_new_pin: pin
        })
        if (pinHashError) console.error('Error saving PIN hash:', pinHashError)
    }

    if (inviteData?.properties?.action_link) {
        const { sendCustomAuthEmail } = await import('@/lib/send-custom-email')
        await sendCustomAuthEmail(email, 'invite', inviteData.properties.action_link)
    }

    revalidatePath('/employees')
    return { success: true }
}

export async function updateEmployee(userId: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check Admin
    const { data: adminProfile } = await supabase.from('profiles').select('role, company_id, department_id').eq('id', user!.id).single()
    if (!adminProfile || !['company_admin', 'manager'].includes(adminProfile.role)) {
        return { error: 'No tienes permisos.' }
    }

    // Ensure target user is in same company
    const { data: targetProfile } = await supabase.from('profiles').select('company_id, status, department_id').eq('id', userId).single()
    if (targetProfile?.company_id !== adminProfile.company_id) {
        return { error: 'Usuario no encontrado en tu empresa.' }
    }

    // If manager, check department restriction
    if (adminProfile.role === 'manager') {
        if (targetProfile?.department_id !== adminProfile.department_id) {
            return { error: 'No tienes permisos para editar empleados fuera de tu departamento.' }
        }
    }

    const fullName = String(formData.get('full_name'))
    const role = String(formData.get('role'))
    const nif = String(formData.get('nif'))
    const phone = String(formData.get('phone'))
    const ssn = String(formData.get('social_security_number'))
    let departmentId = String(formData.get('department_id')) || null
    const pin = String(formData.get('pin_code'))
    const totalVacation = parseInt(String(formData.get('total_vacation_days'))) || 22
    const totalPersonal = parseInt(String(formData.get('total_personal_days'))) || 0
    const scheduledHours = parseFloat(String(formData.get('scheduled_hours'))) || 8.0
    const status = String(formData.get('status'))

    // If manager, they cannot change the department
    if (adminProfile.role === 'manager') {
        departmentId = adminProfile.department_id
    }

    // PIN Code Validation (Security RPC)
    if (pin && pin.trim().length > 0) {
        if (!/^\d{4}$/.test(pin)) {
            return { error: 'El código PIN debe tener exactamente 4 dígitos numéricos.' }
        }
        
        const { data: pinExists, error: pinCheckError } = await supabase.rpc('check_pin_exists_in_company', {
            p_company_id: adminProfile.company_id,
            p_exclude_user_id: userId,
            p_pin: pin
        })

        if (pinCheckError) return { error: `Error validando PIN: ${pinCheckError.message}` }
        if (pinExists) {
            return { error: 'Este código PIN ya está asignado a otro empleado de tu empresa.' }
        }
    }

    // Check Plan Limit if changing status to active
    if (status === 'active' && targetProfile?.status !== 'active') {
        const limitCheck = await checkPlanLimit(adminProfile.company_id)
        if (limitCheck.limited) {
            return { error: `No puedes activar a este usuario. Has alcanzado el límite de ${limitCheck.limit} usuarios activos de tu plan.` }
        }
    }

    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin.from('profiles').update({
        full_name: fullName,
        role: role,
        nif: nif,
        phone: phone,
        social_security_number: ssn,
        department_id: departmentId,
        total_vacation_days: totalVacation,
        total_personal_days: totalPersonal,
        scheduled_hours: scheduledHours,
        status: status as any,
        schedule_type: String(formData.get('schedule_type')) || 'flexible'
    }).eq('id', userId)

    if (error) return { error: error.message }

    // 3. Update PIN Hash if provided
    if (pin && pin.trim().length > 0) {
        const { error: pinHashError } = await supabaseAdmin.rpc('update_employee_pin', {
            p_user_id: userId,
            p_new_pin: pin
        })
        if (pinHashError) return { error: `Perfil actualizado pero error al guardar PIN: ${pinHashError.message}` }
    }

    revalidatePath('/dashboard/employees')
    revalidatePath('/employees')
    return { success: true }
}

export async function getEmployeeSchedules(userId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('work_schedules')
        .select('*')
        .eq('profile_id', userId)
        .order('day_of_week', { ascending: true })

    if (error) return { error: error.message }
    return { data }
}

export async function updateEmployeeSchedules(userId: string, schedules: any[]) {
    const supabase = await createClient()

    // 1. Delete existing
    await supabase.from('work_schedules').delete().eq('profile_id', userId)

    // 2. Insert new ones
    if (schedules.length > 0) {
        const cleanSchedules = schedules.map(s => {
            // Helper to clean time strings (ensure empty is null)
            const cleanTime = (t: any) => (t && String(t).trim().length > 0) ? t : null

            return {
                profile_id: userId,
                day_of_week: Number(s.day_of_week),
                start_time: s.start_time || '09:00',
                end_time: s.end_time || '18:00',
                start_time_2: cleanTime(s.start_time_2),
                end_time_2: cleanTime(s.end_time_2),
                is_active: s.is_active ?? s.active ?? true
            }
        })

        const { error } = await supabase.from('work_schedules').insert(cleanSchedules)
        if (error) return { error: error.message }
    }

    revalidatePath('/employees')
    return { success: true }
}

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
            .in('status', ['active', 'medical_leave', 'unpaid_leave'])

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

    // Fetch Company Settings for defaults
    const { data: company } = await supabase
        .from('companies')
        .select('settings')
        .eq('id', adminProfile.company_id)
        .single()

    const companySettings = company?.settings as any || {}

    const email = String(formData.get('email'))
    const fullName = String(formData.get('full_name'))
    const role = String(formData.get('role')) || 'employee'
    const nif = String(formData.get('nif')) || null
    const phone = String(formData.get('phone')) || null
    const ssn = String(formData.get('social_security_number')) || null
    const jobTitle = String(formData.get('job_title')) || null
    const departmentId = String(formData.get('department_id')) || null
    const scheduledHours = parseFloat(String(formData.get('scheduled_hours'))) || 8.0
    const pin = String(formData.get('pin_code')) || null

    // Check if provided in form, otherwise use company defaults or fallbacks
    const formVacation = formData.get('total_vacation_days')
    const totalVacation = formVacation ? parseInt(String(formVacation)) : (companySettings.default_vacation_days ?? 22)

    const formPersonal = formData.get('total_personal_days')
    const totalPersonal = formPersonal ? parseInt(String(formPersonal)) : (companySettings.default_personal_days ?? 0)

    // If manager, enforce THEIR department
    if (adminProfile.role === 'manager') {
        if (!adminProfile.department_id) {
            return { error: 'Como manager, debes tener un departamento asignado para invitar empleados.' }
        }
    }

    // PIN Code Validation
    if (pin && pin.trim().length > 0) {
        if (!/^\d{4}$/.test(pin)) {
            return { error: 'El código PIN debe tener exactamente 4 dígitos numéricos.' }
        }

        const { data: existingPin } = await supabase
            .from('profiles')
            .select('id')
            .eq('company_id', adminProfile.company_id)
            .eq('pin_code', pin)
            .maybeSingle()

        if (existingPin) {
            return { error: 'Este código PIN ya está asignado a otro empleado de tu empresa.' }
        }
    }

    const supabaseAdmin = createAdminClient()
    const siteUrl = await getSiteUrl()

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

    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
        id: newUserId,
        company_id: adminProfile.company_id,
        role: role,
        full_name: fullName,
        nif: nif,
        phone: phone,
        social_security_number: ssn,
        department: jobTitle,
        department_id: adminProfile.role === 'manager' ? adminProfile.department_id : departmentId,
        scheduled_hours: scheduledHours,
        pin_code: pin,
        total_vacation_days: totalVacation,
        total_personal_days: totalPersonal,
        status: 'active'
    })

    if (profileError) {
        return { error: `Usuario invitado pero error al crear perfil: ${profileError.message}` }
    }

    if (inviteData?.properties?.action_link) {
        const { sendCustomAuthEmail } = await import('@/lib/send-custom-email')
        await sendCustomAuthEmail(email, 'invite', inviteData.properties.action_link)
    }

    revalidatePath('/gestion/empleados')
    return { success: true }
}

export async function updateEmployee(userId: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: adminProfile } = await supabase.from('profiles').select('role, company_id, department_id').eq('id', user!.id).single()
    if (!adminProfile || !['company_admin', 'manager'].includes(adminProfile.role)) {
        return { error: 'No tienes permisos.' }
    }

    const { data: targetProfile } = await supabase.from('profiles').select('company_id, status, department_id').eq('id', userId).single()
    if (targetProfile?.company_id !== adminProfile.company_id) {
        return { error: 'Usuario no encontrado en tu empresa.' }
    }

    if (adminProfile.role === 'manager' && targetProfile?.department_id !== adminProfile.department_id) {
        return { error: 'No tienes permisos para editar empleados fuera de tu departamento.' }
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
    const scheduleType = String(formData.get('schedule_type')) || 'flexible'

    if (adminProfile.role === 'manager') {
        departmentId = adminProfile.department_id
    }

    if (pin && pin.trim().length > 0) {
        if (!/^\d{4}$/.test(pin)) {
            return { error: 'El código PIN debe tener exactamente 4 dígitos numéricos.' }
        }
        const { data: existingPin } = await supabase
            .from('profiles')
            .select('id')
            .eq('company_id', adminProfile.company_id)
            .eq('pin_code', pin)
            .neq('id', userId)
            .maybeSingle()

        if (existingPin) {
            return { error: 'Este código PIN ya está asignado a otro empleado de tu empresa.' }
        }
    }

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
        pin_code: pin,
        total_vacation_days: totalVacation,
        total_personal_days: totalPersonal,
        scheduled_hours: scheduledHours,
        status: status as any,
        schedule_type: scheduleType
    }).eq('id', userId)

    if (error) return { error: error.message }

    revalidatePath('/gestion/empleados')
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

interface ScheduleInput {
    day_of_week: number
    start_time?: string | null
    end_time?: string | null
    start_time_2?: string | null
    end_time_2?: string | null
    target_total_hours?: number
    is_active?: boolean
    active?: boolean
}

export async function updateEmployeeSchedules(userId: string, schedules: ScheduleInput[], scheduleType: string = 'fixed') {
    const supabase = await createClient()

    // 1. Delete existing
    await supabase.from('work_schedules').delete().eq('profile_id', userId)

    // 2. Insert new ones
    if (schedules.length > 0) {
        const isFlex = scheduleType === 'flexible'
        const cleanSchedules = schedules.map(s => {
            const cleanTime = (t: string | null | undefined) => (t && String(t).trim().length > 0) ? t : null

            return {
                profile_id: userId,
                day_of_week: Number(s.day_of_week),
                start_time: isFlex ? null : (s.start_time || '09:00'),
                end_time: isFlex ? null : (s.end_time || '18:00'),
                start_time_2: isFlex ? null : cleanTime(s.start_time_2),
                end_time_2: isFlex ? null : cleanTime(s.end_time_2),
                target_total_hours: s.target_total_hours || 8.0,
                is_active: s.is_active ?? s.active ?? true
            }
        })

        const { error } = await supabase.from('work_schedules').insert(cleanSchedules)
        if (error) return { error: error.message }
    }

    revalidatePath('/gestion/empleados')
    return { success: true }
}

export async function toggleEmployeeStatus(userId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado.' }

    const { data: adminProfile } = await supabase.from('profiles').select('role, company_id, department_id').eq('id', user.id).single()
    if (!adminProfile || !['company_admin', 'manager'].includes(adminProfile.role)) {
        return { error: 'No tienes permisos.' }
    }

    const { data: targetProfile } = await supabase.from('profiles').select('company_id, status, department_id').eq('id', userId).single()
    if (!targetProfile || targetProfile.company_id !== adminProfile.company_id) {
        return { error: 'Usuario no encontrado en tu empresa.' }
    }

    const newStatus = targetProfile.status === 'active' ? 'terminated' : 'active'

    if (newStatus === 'active') {
        const limitCheck = await checkPlanLimit(adminProfile.company_id)
        if (limitCheck.limited) {
            return { error: `No puedes activar a este usuario. Has alcanzado el límite de ${limitCheck.limit} usuarios activos de tu plan.` }
        }
    }

    const supabaseAdmin = createAdminClient()
    const { error } = await supabaseAdmin.from('profiles').update({ status: newStatus as any }).eq('id', userId)

    if (error) return { error: error.message }

    revalidatePath('/gestion/empleados')
    return { success: true, newStatus }
}

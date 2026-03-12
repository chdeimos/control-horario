'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendEmailNotification } from '@/lib/email'

async function checkTimeOffOverlap(userId: string, startDate: string, endDate: string, requestId?: string) {
    const supabase = await createClient()

    // 1. Past date check (only for new requests, but let's be strict as requested)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const requestStart = new Date(startDate)
    if (requestStart < today) {
        return { error: 'No se pueden solicitar días en fechas pasadas.' }
    }

    if (new Date(endDate) < requestStart) {
        return { error: 'La fecha de fin no puede ser anterior a la de inicio.' }
    }

    // 2. Overlap check
    let query = supabase
        .from('time_off_requests')
        .select('start_date, end_date, request_type, status')
        .eq('user_id', userId)
        .neq('status', 'rejected') // Only consider pending/approved

    if (requestId) {
        query = query.neq('id', requestId)
    }

    const { data: existing } = await query

    const hasOverlap = existing?.some(req => {
        return startDate <= req.end_date && endDate >= req.start_date
    })

    if (hasOverlap) {
        const overlap = existing!.find(req => startDate <= req.end_date && endDate >= req.start_date)!
        const typeLabels: Record<string, string> = { vacation: 'Vacaciones', personal: 'Asuntos Propios', medical: 'Baja Médica', other: 'Ausencia' }
        return {
            error: `Conflicto de fechas: ya existe una solicitud de ${typeLabels[overlap.request_type] || overlap.request_type} del ${overlap.start_date} al ${overlap.end_date} marcada como ${overlap.status === 'approved' ? 'APROBADA' : 'PENDIENTE'}.`
        }
    }

    return { success: true }
}

export async function requestTimeOff(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { data: profile } = await supabase.from('profiles').select('company_id, full_name').eq('id', user.id).single()
    if (!profile) return { error: 'Perfil no encontrado' }

    const type = String(formData.get('type'))
    const start = String(formData.get('start'))
    const end = String(formData.get('end'))
    const reason = String(formData.get('reason'))

    // 0. Parse Dates & Calculate Duration
    const startObj = new Date(start)
    const endObj = new Date(end)

    // Validation: Overlap and Past dates
    const overlapCheck = await checkTimeOffOverlap(user.id, start, end)
    if (overlapCheck.error) return { error: overlapCheck.error }

    const diffTime = Math.abs(endObj.getTime() - startObj.getTime())
    const newDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    const requestYear = startObj.getFullYear()

    // 1. Fetch Limits & Current Usage for THIS Year
    const { data: profileWithLimits } = await supabase
        .from('profiles')
        .select('total_vacation_days, total_personal_days')
        .eq('id', user.id)
        .single()

    const limit = type === 'vacation'
        ? (profileWithLimits?.total_vacation_days ?? 22)
        : type === 'personal'
            ? (profileWithLimits?.total_personal_days ?? 0)
            : 999 // Medical/Other has no limit

    // Fetch approved requests for this year
    const startOfYear = `${requestYear}-01-01`
    const endOfYear = `${requestYear}-12-31`

    const { data: existingRequests } = await supabase
        .from('time_off_requests')
        .select('start_date, end_date')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .eq('request_type', type)
        .gte('start_date', startOfYear)
        .lte('end_date', endOfYear)

    let usedDays = 0
    existingRequests?.forEach(req => {
        const d1 = new Date(req.start_date)
        const d2 = new Date(req.end_date)
        const diff = Math.abs(d2.getTime() - d1.getTime())
        usedDays += Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
    })

    if (usedDays + newDays > limit) {
        return { error: `Saldo insuficiente. Tienes ${limit - usedDays} días disponibles y solicitas ${newDays}.` }
    }

    const { error } = await supabase.from('time_off_requests').insert({
        user_id: user.id,
        company_id: profile.company_id,
        request_type: type,
        start_date: start,
        end_date: end,
        reason: reason,
        status: 'pending'
    })

    if (error) return { error: error.message }
    revalidatePath('/gestion/dias-libres')
    return { success: true }
}

export async function updateRequestStatus(requestId: string, status: 'pending' | 'approved' | 'rejected', managerNote?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Verify permissions
    const { data: adminProfile } = await supabase.from('profiles').select('role, department_id').eq('id', user!.id).single()
    if (!['company_admin', 'manager'].includes(adminProfile?.role)) {
        return { error: 'No tienes permisos para aprobar/rechazar.' }
    }

    // Validation: Rejection requires note
    if (status === 'rejected' && (!managerNote || managerNote.trim().length === 0)) {
        return { error: 'Debes indicar un motivo para el rechazo.' }
    }

    // Get request info with department
    const { data: request, error: fetchError } = await supabase
        .from('time_off_requests')
        .select('*, profiles(full_name, department_id)')
        .eq('id', requestId)
        .single()

    if (fetchError || !request) {
        return { error: `Solicitud no encontrada.` }
    }

    // If manager, check department
    if (adminProfile?.role === 'manager') {
        if (request.profiles?.department_id !== adminProfile.department_id) {
            return { error: 'No tienes permisos para gestionar solicitudes fuera de tu departamento.' }
        }
    }

    const { error } = await supabase
        .from('time_off_requests')
        .update({
            status,
            manager_note: managerNote // Save the note
        })
        .eq('id', requestId)

    if (error) return { error: error.message }

    // Enviar Email
    try {
        const { createAdminClient } = await import('@/lib/supabase/admin') // Dynamic import to avoid earlier error
        const adminClient = createAdminClient()
        const { data: userData } = await adminClient.auth.admin.getUserById(request.user_id)
        const userEmail = userData.user?.email

        if (userEmail) {
            let subject = `Actualización de Solicitud 📅`
            let html = `<p>Hola ${request.profiles.full_name},</p>`

            if (status === 'approved') {
                subject = `Solicitud Aprobada ✅`
                html += `<p>Tu solicitud del <strong>${request.start_date}</strong> al <strong>${request.end_date}</strong> ha sido <strong>APROBADA</strong>.</p>`
            } else if (status === 'rejected') {
                subject = `Solicitud Rechazada ❌`
                html += `<p>Tu solicitud del <strong>${request.start_date}</strong> al <strong>${request.end_date}</strong> ha sido <strong>RECHAZADA</strong>.</p>`
                if (managerNote) {
                    html += `<p><strong>Motivo del rechazo:</strong> ${managerNote}</p>`
                }
            } else {
                subject = `Solicitud Pospuesta ⏳`
                html += `<p>Tu solicitud del <strong>${request.start_date}</strong> al <strong>${request.end_date}</strong> ha vuelto al estado <strong>PENDIENTE</strong>.</p>`
            }

            await sendEmailNotification(userEmail, subject, html)
        }
    } catch (err) {
        console.error("Email fetch failed:", err)
    }

    revalidatePath('/gestion/dias-libres')
    return { success: true }
}

export async function editTimeOffRequest(requestId: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const type = String(formData.get('type'))
    const start = String(formData.get('start'))
    const end = String(formData.get('end'))
    const reason = String(formData.get('reason'))

    const { data: requester } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isAdmin = ['company_admin', 'manager'].includes(requester?.role)

    // Fetch original request to get userId (admin case)
    const { data: original } = await supabase.from('time_off_requests').select('user_id').eq('id', requestId).single()
    if (!original) return { error: 'Solicitud no encontrada' }

    // Validation: Overlap and Past dates
    const overlapCheck = await checkTimeOffOverlap(original.user_id, start, end, requestId)
    if (overlapCheck.error) return { error: overlapCheck.error }

    // Si no es admin, solo puede editar SUYAS y PENDIENTES. Si es admin, puede editar CUALQUIERA y en CUALQUIER ESTADO.
    let query = supabase
        .from('time_off_requests')
        .update({
            request_type: type,
            start_date: start,
            end_date: end,
            reason: reason
        })
        .eq('id', requestId)

    if (!isAdmin) {
        query = query.eq('user_id', user.id).eq('status', 'pending')
    }

    const { error, data } = await query.select('*, profiles(full_name)').single()

    if (error) return { error: error.message }

    const updatedRequest = data;

    // Enviar Email de cambio
    try {
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const adminClient = createAdminClient()
        const { data: userData } = await adminClient.auth.admin.getUserById(updatedRequest.user_id)
        const userEmail = userData.user?.email

        if (userEmail) {
            const subject = `Solicitud Modificada ✏️`
            const html = `
                <p>Hola ${updatedRequest.profiles.full_name},</p>
                <p>Los detalles de la solicitud han sido modificados:</p>
                <ul>
                    <li>Tipo: ${type}</li>
                    <li>Fechas: ${start} a ${end}</li>
                    <li>Motivo: ${reason}</li>
                </ul>
            `
            await sendEmailNotification(userEmail, subject, html)
        }
    } catch (err) { console.error(err) }

    revalidatePath('/gestion/dias-libres')
    return { success: true }
}

export async function adminCreateTimeOff(formData: FormData) {
    const supabase = await createClient()
    const { data: { user: adminUser } } = await supabase.auth.getUser()
    if (!adminUser) return { error: 'No autenticado' }

    // Verify permissions
    const { data: adminProfile } = await supabase.from('profiles').select('role, company_id, department_id').eq('id', adminUser.id).single()
    if (!adminProfile || !['company_admin', 'manager'].includes(adminProfile.role)) {
        return { error: 'No tienes permisos para crear ausencias.' }
    }

    const targetUserId = String(formData.get('userId'))
    const type = String(formData.get('type'))
    const start = String(formData.get('start'))
    const end = String(formData.get('end'))
    const reason = String(formData.get('reason'))

    // Verify target user is in the same company/department
    const { data: targetProfile } = await supabase.from('profiles').select('full_name, company_id, department_id').eq('id', targetUserId).single()
    if (!targetProfile || targetProfile.company_id !== adminProfile.company_id) {
        return { error: 'Empleado no encontrado o fuera de tu empresa.' }
    }

    if (adminProfile.role === 'manager' && targetProfile.department_id !== adminProfile.department_id) {
        return { error: 'No puedes crear ausencias para empleados de otros departamentos.' }
    }

    // Validation: Overlap and Past dates
    const overlapCheck = await checkTimeOffOverlap(targetUserId, start, end)
    if (overlapCheck.error) return { error: overlapCheck.error }

    const { error } = await supabase.from('time_off_requests').insert({
        user_id: targetUserId,
        company_id: adminProfile.company_id,
        request_type: type,
        start_date: start,
        end_date: end,
        reason: reason,
        status: 'approved' // Created by admin = auto approved
    })

    if (error) return { error: error.message }

    // Enviar Email
    try {
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const adminClient = createAdminClient()
        const { data: userData } = await adminClient.auth.admin.getUserById(targetUserId)
        const userEmail = userData.user?.email

        if (userEmail) {
            const subject = `Nueva Ausencia Programada 📅`
            const html = `
                <p>Hola ${targetProfile.full_name},</p>
                <p>Se ha registrado una nueva <strong>${type === 'vacation' ? 'Vacación' : type === 'medical' ? 'Baja Médica' : 'Ausencia'}</strong> en tu calendario por parte de administración.</p>
                <p><strong>Fechas:</strong> del ${start} al ${end}</p>
                ${reason ? `<p><strong>Motivo/Nota:</strong> ${reason}</p>` : ''}
                <p>Esta ausencia ya ha sido aprobada y se verá reflejada en tu panel.</p>
            `
            await sendEmailNotification(userEmail, subject, html)
        }
    } catch (err) { console.error(err) }

    revalidatePath('/gestion/dias-libres')
    revalidatePath('/dashboard')
    return { success: true }
}

export async function getEmployeesForTimeOff() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: adminProfile } = await supabase.from('profiles').select('role, company_id, department_id').eq('id', user.id).single()
    if (!adminProfile || !['company_admin', 'manager'].includes(adminProfile.role)) return []

    let query = supabase
        .from('profiles')
        .select('id, full_name, department_id')
        .eq('company_id', adminProfile.company_id)
        .neq('status', 'terminated')
        .order('full_name')

    if (adminProfile.role === 'manager' && adminProfile.department_id) {
        query = query.eq('department_id', adminProfile.department_id)
    }

    const { data } = await query
    return data || []
}

export async function deleteTimeOffRequest(requestId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    // Verify permissions
    const { data: adminProfile } = await supabase.from('profiles').select('role, department_id').eq('id', user.id).single()
    if (!adminProfile || !['company_admin', 'manager'].includes(adminProfile.role)) {
        return { error: 'No tienes permisos para borrar solicitudes.' }
    }

    // Get request info to check department
    const { data: request } = await supabase
        .from('time_off_requests')
        .select('*, profiles(full_name, department_id)')
        .eq('id', requestId)
        .single()

    if (!request) return { error: 'Solicitud no encontrada' }

    if (adminProfile.role === 'manager') {
        if (request.profiles?.department_id !== adminProfile.department_id) {
            return { error: 'No tienes permisos para borrar solicitudes fuera de tu departamento.' }
        }
    }

    const { error } = await supabase.from('time_off_requests').delete().eq('id', requestId)
    if (error) return { error: error.message }

    // Enviar Email de cancelación
    try {
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const adminClient = createAdminClient()
        const { data: userData } = await adminClient.auth.admin.getUserById(request.user_id)
        const userEmail = userData.user?.email

        if (userEmail) {
            const subject = `Solicitud Anulada 🚫`
            const html = `
                <p>Hola ${request.profiles.full_name},</p>
                <p>Te informamos de que tu solicitud de <strong>${request.request_type === 'vacation' ? 'Vacaciones' : 'Ausencia'}</strong> ha sido <strong>ANULADA</strong> y eliminada del sistema por administración.</p>
                <p><strong>Fechas que han sido canceladas:</strong> del ${request.start_date} al ${request.end_date}</p>
                <p>Si crees que esto es un error, por favor contacta con tu responsable.</p>
            `
            await sendEmailNotification(userEmail, subject, html)
        }
    } catch (err) { console.error("Cancellation email failed:", err) }

    revalidatePath('/gestion/dias-libres')
    revalidatePath('/dashboard')
    return { success: true }
}

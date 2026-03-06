'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getPlans() {
    const supabase = await createClient()
    const { data: plans, error } = await supabase
        .from('plans')
        .select(`
            *,
            volume_discounts (*)
        `)
        .order('price_per_user', { ascending: true })

    if (error) return { error: error.message }

    // Count companies and active users per plan
    const plansWithCounts = await Promise.all((plans || []).map(async (p: any) => {
        // Get companies for this plan
        const { data: companies } = await supabase
            .from('companies')
            .select('id')
            .eq('plan_id', p.id)

        const companyIds = (companies || []).map(c => c.id)

        // Count active users in those companies
        let activeUsersCount = 0
        if (companyIds.length > 0) {
            const { count } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .in('company_id', companyIds)
                .eq('is_active', true)
            activeUsersCount = count || 0
        }

        return {
            ...p,
            companies_count: companyIds.length,
            active_users_count: activeUsersCount
        }
    }))

    return { data: plansWithCounts }
}

export async function createPlan(formData: FormData) {
    const supabase = await createClient()
    const name = String(formData.get('name'))
    const billingType = String(formData.get('billing_type'))
    const pricePerUser = parseFloat(String(formData.get('price_per_user') || 0))
    const fixedPrice = parseFloat(String(formData.get('fixed_price') || 0))
    const fixedUsersLimit = parseInt(String(formData.get('fixed_users_limit') || 0))

    const { error } = await supabase
        .from('plans')
        .insert({
            name,
            billing_type: billingType,
            price_per_user: pricePerUser,
            fixed_price: fixedPrice,
            fixed_users_limit: fixedUsersLimit
        })

    if (error) return { error: error.message }
    revalidatePath('/d105/plans')
    return { success: true }
}

export async function updatePlan(id: string, formData: FormData) {
    const supabase = await createClient()
    const name = String(formData.get('name'))
    const billingType = String(formData.get('billing_type'))
    const pricePerUser = parseFloat(String(formData.get('price_per_user') || 0))
    const fixedPrice = parseFloat(String(formData.get('fixed_price') || 0))
    const fixedUsersLimit = parseInt(String(formData.get('fixed_users_limit') || 0))

    const { error } = await supabase
        .from('plans')
        .update({
            name,
            billing_type: billingType,
            price_per_user: pricePerUser,
            fixed_price: fixedPrice,
            fixed_users_limit: fixedUsersLimit
        })
        .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/d105/plans')
    return { success: true }
}

export async function deletePlan(id: string, migrateToId?: string) {
    const supabase = await createClient()

    // 1. Check if plan is being used
    const { count } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('plan_id', id)

    if (count && count > 0) {
        if (!migrateToId) {
            return {
                error: 'DEPENDENCY_REQUIRED',
                message: `Hay ${count} empresas usando este plan. Debes seleccionar un plan de migración.`,
                count
            }
        }

        // 2. Migrate companies
        const { error: migrateError } = await supabase
            .from('companies')
            .update({ plan_id: migrateToId })
            .eq('plan_id', id)

        if (migrateError) return { error: migrateError.message }
    }

    // 3. Delete plan
    const { error: deleteError } = await supabase
        .from('plans')
        .delete()
        .eq('id', id)

    if (deleteError) return { error: deleteError.message }

    revalidatePath('/d105/plans')
    return { success: true }
}

export async function addDiscount(planId: string, minUsers: number, percentage: number) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('volume_discounts')
        .insert({ plan_id: planId, min_users: minUsers, discount_percentage: percentage })

    if (error) return { error: error.message }
    revalidatePath('/d105/plans')
    return { success: true }
}

export async function deleteDiscount(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('volume_discounts')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/d105/plans')
    return { success: true }
}

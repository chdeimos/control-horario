import { RegistryView } from './registry-view'
import { getDepartments } from '../actions'
import { createClient } from '@/lib/supabase/server'

export default async function RegistryPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Obtener perfil para determinar permisos
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single()

    const isAdmin = ['company_admin', 'super_admin', 'manager'].includes(profile?.role || '')
    const departments = isAdmin ? await getDepartments() : []

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Registro General</h2>
                <p className="text-muted-foreground">Estado de la plantilla y cumplimiento horario en tiempo real.</p>
            </div>

            <RegistryView departments={departments} isAdmin={isAdmin} />
        </div>
    )
}

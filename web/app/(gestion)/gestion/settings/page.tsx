import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DepartmentsTab } from './departments-tab'
import { GeneralTab } from './general-tab'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('role, company_id').eq('id', user.id).single()

    if (!profile || profile.role !== 'company_admin') {
        return <div className="p-8">No tienes permisos para acceder a esta sección. Solo los administradores de empresa pueden gestionar la configuración.</div>
    }

    // Fetch Initial Data
    const { data: departments } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name')

    const { data: company } = await supabase
        .from('companies')
        .select('name, cif, address, email, phone, logo_large_url, logo_app_url, logo_web_url, settings')
        .eq('id', profile.company_id)
        .single()

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>

            <Tabs defaultValue="general" className="w-full">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="departments">Departamentos</TabsTrigger>
                </TabsList>
                <TabsContent value="general">
                    <GeneralTab company={company} />
                </TabsContent>
                <TabsContent value="departments">
                    <DepartmentsTab departments={departments || []} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

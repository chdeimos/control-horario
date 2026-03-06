import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DepartmentsTab } from './departments-tab'
import { GeneralTab } from './general-tab'
import { SecurityTab } from './security-tab'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('id, full_name, email, role, company_id, two_factor_enabled').eq('id', user.id).single()

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

    const { getCompanyKioskData } = await import('./actions')
    const kioskData = await getCompanyKioskData()

    return (
        <div className="animate-in fade-in duration-700 min-h-screen bg-[#f3f4f9] md:-m-12">
            <Tabs defaultValue="general" className="w-full">
                {/* Professional Elegant Blue Banner (DESIGN_GUIDELINES Section 4) */}
                <header className="bg-[#3b60c1] pt-16 pb-16 px-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
                                    Configuración
                                </h2>
                                <p className="text-blue-100/80 text-base font-medium max-w-lg">
                                    Administración de parámetros corporativos, estructura organizacional, reglas de negocio y personalización de la instancia de gestión.
                                </p>
                            </div>
                        </div>

                        {/* Premium Underline Tabs (Inside header area) */}
                        <TabsList className="bg-transparent border-b border-white/20 h-auto p-0 w-full justify-start gap-10 rounded-none overflow-x-auto no-scrollbar">
                            <TabsTrigger
                                value="general"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-blue-100/60 text-[11px] font-black uppercase tracking-[0.2em] px-0 py-4 transition-all hover:text-white flex items-center"
                            >
                                General
                            </TabsTrigger>
                            <TabsTrigger
                                value="departments"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-blue-100/60 text-[11px] font-black uppercase tracking-[0.2em] px-0 py-4 transition-all hover:text-white flex items-center"
                            >
                                Departamentos
                            </TabsTrigger>
                            <TabsTrigger
                                value="security"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-blue-100/60 text-[11px] font-black uppercase tracking-[0.2em] px-0 py-4 transition-all hover:text-white flex items-center"
                            >
                                Seguridad
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-10 -mt-12 relative z-20 space-y-12 pb-20">
                    <TabsContent value="general" className="mt-0 focus-visible:outline-none">
                        <GeneralTab company={company} />
                    </TabsContent>
                    <TabsContent value="departments" className="mt-0 focus-visible:outline-none">
                        <DepartmentsTab departments={departments || []} />
                    </TabsContent>
                    <TabsContent value="security" className="mt-0 focus-visible:outline-none">
                        <SecurityTab profile={profile} kioskData={kioskData} mode="company" />
                    </TabsContent>

                </div>
            </Tabs>
        </div>
    )
}

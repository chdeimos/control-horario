import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DepartmentsTab } from './departments-tab'
import { GeneralTab } from './general-tab'
import { Settings, Building2, LayoutGrid } from 'lucide-react'

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
        <div className="animate-in fade-in duration-700 space-y-8 md:-m-8">
            {/* Professional Elegant Blue Banner (DESIGN_GUIDELINES Section 4) */}
            <header className="bg-[#3b60c1] pt-16 pb-0 px-10 relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-5 w-1 bg-white rounded-full"></div>
                        <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.4em]">Parámetros del Ecosistema Corporativo</p>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
                        <div>
                            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase italic leading-none">
                                Configu<br /><span className="text-blue-200">ración</span>
                            </h2>
                            <p className="text-blue-100/60 mt-4 text-[10px] font-bold uppercase tracking-widest max-w-lg leading-relaxed">
                                Administración de la identidad corporativa, estructura organizacional y parámetros base de la instancia.
                            </p>
                        </div>
                    </div>

                    <Tabs defaultValue="general" className="w-full">
                        {/* Premium Underline Tabs (Inside header area) */}
                        <TabsList className="bg-transparent border-b border-white/20 h-auto p-0 w-full justify-start gap-10 rounded-none overflow-x-auto no-scrollbar">
                            <TabsTrigger
                                value="general"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-blue-100/60 text-[11px] font-black uppercase tracking-[0.2em] px-0 py-4 transition-all hover:text-white flex items-center gap-3"
                            >
                                <Building2 size={16} />
                                General
                            </TabsTrigger>
                            <TabsTrigger
                                value="departments"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-blue-100/60 text-[11px] font-black uppercase tracking-[0.2em] px-0 py-4 transition-all hover:text-white flex items-center gap-3"
                            >
                                <LayoutGrid size={16} />
                                Departamentos
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-10 pb-12">
                <Tabs defaultValue="general" className="w-full">
                    <TabsContent value="general" className="mt-0 focus-visible:outline-none">
                        <GeneralTab company={company} />
                    </TabsContent>
                    <TabsContent value="departments" className="mt-0 focus-visible:outline-none">
                        <DepartmentsTab departments={departments || []} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

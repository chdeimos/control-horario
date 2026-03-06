import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './profile-form'
import { SettingsForm } from './settings-form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BackupTab } from './backup-tab'
import { SecurityTab } from './security-tab'
import { PersonalSecurity } from './personal-security'
import { Settings, UserCircle, Database, ShieldCheck, Terminal, Fingerprint, Cpu, HardDrive } from 'lucide-react'
import { getSettings, getSecuritySettings } from './actions'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()
    const { data: settings, error } = await getSettings()
    const currentTtl = await getSecuritySettings()

    if (error) {
        return (
            <div className="p-10 bg-white min-h-screen">
                <div className="bg-rose-50 border border-rose-100 p-8 rounded-xl flex items-center gap-6 text-rose-600 shadow-2xl shadow-rose-200/50">
                    <div className="w-16 h-16 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                        <Terminal size={32} />
                    </div>
                    <div>
                        <h4 className="text-xl font-black uppercase tracking-tight">Fallo en Parámetros</h4>
                        <p className="font-bold text-sm opacity-80 mt-1">Error de Lectura de Núcleo: {error}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="animate-in fade-in duration-700">
            {/* Professional Elegant Blue Banner (DESIGN_GUIDELINES Section 4) */}
            <header className="bg-[#3b60c1] pt-20 pb-32 px-10 relative overflow-hidden md:-m-12 mb-12">
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                        <div>
                            <h2 className="text-4xl font-black tracking-tight text-white uppercase leading-none">
                                Configuración
                            </h2>
                            <p className="text-blue-100/60 mt-6 text-xs font-bold uppercase tracking-widest max-w-lg leading-relaxed">
                                Gestión de la infraestructura base, protocolos de seguridad y administración de datos.
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
                                <Fingerprint size={16} />
                                Identidad Root
                            </TabsTrigger>
                            <TabsTrigger
                                value="system"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-blue-100/60 text-[11px] font-black uppercase tracking-[0.2em] px-0 py-4 transition-all hover:text-white flex items-center gap-3"
                            >
                                <Cpu size={16} />
                                Datos Plataforma
                            </TabsTrigger>
                            <TabsTrigger
                                value="backup"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-blue-100/60 text-[11px] font-black uppercase tracking-[0.2em] px-0 py-4 transition-all hover:text-white flex items-center gap-3"
                            >
                                <HardDrive size={16} />
                                Copias de Seguridad
                            </TabsTrigger>
                            <TabsTrigger
                                value="security"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-blue-100/60 text-[11px] font-black uppercase tracking-[0.2em] px-0 py-4 transition-all hover:text-white flex items-center gap-3"
                            >
                                <ShieldCheck size={16} />
                                SEGURIDAD
                            </TabsTrigger>
                        </TabsList>

                        <div className="max-w-7xl mx-auto px-0 md:px-0 relative z-20 pb-20">
                            <div className="pt-12 -mt-20 md:mt-12">
                                <TabsContent value="general" className="mt-0 focus-visible:ring-0 outline-none">
                                    <div className="max-w-4xl space-y-12">
                                        <ProfileForm profile={profile} userEmail={user?.email || ''} />
                                        <PersonalSecurity profile={profile} />
                                    </div>
                                </TabsContent>

                                <TabsContent value="system" className="mt-0 focus-visible:ring-0 outline-none">
                                    <div className="max-w-4xl">
                                        <SettingsForm settings={settings} />
                                    </div>
                                </TabsContent>

                                <TabsContent value="backup" className="mt-0 focus-visible:ring-0 outline-none">
                                    <div className="max-w-4xl">
                                        <BackupTab />
                                    </div>
                                </TabsContent>

                                <TabsContent value="security" className="mt-0 focus-visible:ring-0 outline-none">
                                    <div className="max-w-4xl">
                                        <SecurityTab currentTtl={currentTtl} />
                                    </div>
                                </TabsContent>
                            </div>
                        </div>
                    </Tabs>
                </div>
            </header>
        </div>
    )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SecurityTab } from '../configuracion/security-tab'
import { ProfileForm } from './profile-form'
import { User, Shield } from 'lucide-react'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/gestion/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select(`
            id, 
            full_name, 
            email, 
            phone,
            role, 
            company_id, 
            two_factor_enabled,
            departments (name)
        `)
        .eq('id', user.id)
        .single()

    if (!profile) redirect('/gestion/login')

    return (
        <div className="animate-in fade-in duration-700 min-h-screen bg-[#f3f4f9] md:-m-12">
            <Tabs defaultValue="info" className="w-full">
                {/* Professional Elegant Blue Banner (DESIGN_GUIDELINES Section 4) */}
                <header className="bg-[#3b60c1] pt-16 pb-16 px-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
                                    Mi Perfil
                                </h2>
                                <p className="text-blue-100/80 text-base font-medium max-w-lg">
                                    Gestión de credenciales personales, información de contacto y configuración de protocolos de seguridad avanzada en el ecosistema.
                                </p>
                            </div>
                        </div>

                        {/* Premium Underline Tabs (Inside header area) */}
                        <TabsList className="bg-transparent border-b border-white/20 h-auto p-0 w-full justify-start gap-10 rounded-none overflow-x-auto no-scrollbar">
                            <TabsTrigger
                                value="info"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-blue-100/60 text-[11px] font-black uppercase tracking-[0.2em] px-0 py-4 transition-all hover:text-white flex items-center gap-3"
                            >
                                <User size={16} />
                                Identidad
                            </TabsTrigger>
                            <TabsTrigger
                                value="security"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-blue-100/60 text-[11px] font-black uppercase tracking-[0.2em] px-0 py-4 transition-all hover:text-white flex items-center gap-3"
                            >
                                <Shield size={16} />
                                Seguridad
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-10 -mt-12 relative z-20 space-y-12 pb-20">
                    <TabsContent value="info" className="space-y-10 focus-visible:outline-none">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Avatar & Summary Card */}
                            <div className="lg:col-span-4">
                                <div className="bg-white rounded-lg border border-slate-100 shadow-2xl shadow-slate-900/5 overflow-hidden">
                                    <div className="h-24 bg-gradient-to-r from-[#3b60c1] to-[#2d4a94]" />
                                    <div className="px-8 pb-8">
                                        <div className="relative -mt-12 mb-6">
                                            <div className="h-24 w-24 bg-white rounded-lg p-1 shadow-xl">
                                                <div className="h-full w-full bg-slate-900 rounded-lg flex items-center justify-center">
                                                    <User size={40} className="text-white" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 right-0 h-6 w-6 bg-green-500 border-4 border-white rounded-full" />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-1">{profile.full_name}</h3>
                                        <p className="text-xs font-black text-[#3b60c1] uppercase tracking-widest mb-6">
                                            {profile.role === 'company_admin' ? 'Administrador' : profile.role.replace('_', ' ')}
                                        </p>

                                        <div className="pt-6 border-t border-slate-50 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Estado</span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-50 px-2 py-1 rounded-lg">Activo</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Verificado</span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900">100% Secure</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Details Cards */}
                            <div className="lg:col-span-8 space-y-8">
                                <div className="bg-white p-10 rounded-lg border border-slate-100 shadow-2xl shadow-slate-900/5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <User size={120} className="text-slate-900" />
                                    </div>

                                    <div className="flex items-center gap-3 mb-10 text-slate-900">
                                        <div className="h-6 w-1 bg-amber-500 rounded-full"></div>
                                        <h3 className="text-sm font-black uppercase tracking-widest ">Gestión de Identidad</h3>
                                    </div>

                                    <ProfileForm profile={profile} />

                                    <div className="mt-16 p-6 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Actualización periódica requerida por política de empresa
                                        </p>
                                        <span className="text-[10px] font-black text-[#3b60c1] uppercase tracking-widest">v2025.02</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="security" className="focus-visible:outline-none">
                        <div className="max-w-4xl mx-auto">
                            <SecurityTab profile={profile} mode="profile" />
                        </div>
                    </TabsContent>

                </div>
            </Tabs>
        </div>
    )
}

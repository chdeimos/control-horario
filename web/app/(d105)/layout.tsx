import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Building2, Package, CreditCard, Settings, Users, ShieldCheck, ChevronRight } from 'lucide-react'
import { LogoutButton } from '@/components/features/logout-button'
import { SidebarLink } from '@/components/features/sidebar-link'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/d105/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'super_admin') {
        redirect('/')
    }

    // Fetch SaaS Branding
    const { data: settingsData } = await supabase
        .from('system_settings')
        .select('key, value')

    const settings = (settingsData || []).reduce((acc: any, item: any) => {
        acc[item.key] = item.value
        return acc
    }, {})

    const appName = settings.app_name || 'SaaS Admin'

    return (
        <div className="flex h-screen bg-[#f8fafc]">
            {/* Sidebar - Premium Dark Mode */}
            <aside className="w-80 bg-[#0a0a0c] border-r border-white/5 hidden md:flex flex-col relative overflow-hidden shrink-0">
                {/* Visual Detail */}
                <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-[#3b60c1]/10 to-transparent pointer-events-none"></div>

                <div className="p-10 relative z-10">
                    <div className="min-h-[40px] flex items-center">
                        {settings.saas_logo_web ? (
                            <img
                                src={settings.saas_logo_web}
                                alt={appName}
                                className="h-10 w-auto object-contain"
                            />
                        ) : (
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
                                {appName}<span className="text-[#3b60c1]">.</span>
                            </h1>
                        )}
                    </div>
                </div>

                <nav className="flex-1 px-6 space-y-1 relative z-10 overflow-y-auto no-scrollbar">
                    <p className="px-4 pb-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Monitoreo Global</p>
                    <SidebarLink href="/d105" icon={<LayoutDashboard size={18} />} label="Centro de Control" />

                    <div className="h-6"></div>
                    <p className="px-4 pb-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Gestión de Activos</p>
                    <SidebarLink href="/d105/companies" icon={<Building2 size={18} />} label="Sedes y Empresas" />
                    <SidebarLink href="/d105/users" icon={<Users size={18} />} label="Lista de Usuarios" />

                    <div className="h-6"></div>
                    <p className="px-4 pb-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Infraestructura</p>
                    <SidebarLink href="/d105/plans" icon={<Package size={18} />} label="Gestión de Planes" />
                    <SidebarLink href="/d105/billing" icon={<CreditCard size={18} />} label="Facturación SaaS" />
                    <SidebarLink href="/d105/settings" icon={<Settings size={18} />} label="Configuración" />
                </nav>

                <div className="p-8 border-t border-white/5 bg-black/40 relative z-10">
                    <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-lg border border-white/5">
                        <div className="h-10 w-10 bg-[#3b60c1]/20 rounded-lg flex items-center justify-center text-[#3b60c1]">
                            <ShieldCheck size={20} />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-0.5">Administrador de sistema</p>
                            <p className="text-xs font-black text-white truncate tracking-tight">{profile?.full_name}</p>
                        </div>
                    </div>
                    <LogoutButton variant="ghost" className="w-full justify-start text-white/30 hover:text-white hover:bg-white/5 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] transition-all" />
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
                <div className="flex-1 pb-20 p-0 md:p-12">
                    {children}
                </div>

                {/* Footer simple for SuperAdmin */}
                <footer className="px-10 py-6 border-t border-slate-100 flex items-center justify-between text-slate-400">
                    <p className="text-[10px] font-black uppercase tracking-widest">© {new Date().getFullYear()} {appName}</p>
                </footer>
            </main>
        </div>
    )
}


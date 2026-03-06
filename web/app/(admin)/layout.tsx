import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Building2, ArrowLeft, Package, CreditCard, Settings, Users } from 'lucide-react'
import { LogoutButton } from '@/components/features/logout-button'

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
        redirect('/login')
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
    const logoUrl = settings.saas_logo_web

    return (
        <div className="flex h-screen bg-slate-100 selection:bg-blue-50 selection:text-[#3b60c1]">
            {/* Admin Sidebar */}
            <aside className="w-80 bg-slate-900 text-white border-r border-slate-800 hidden md:flex flex-col shrink-0">
                <div className="p-10 px-8">
                    {logoUrl ? (
                        <img src={logoUrl} alt={appName} className="h-8 w-auto object-contain" />
                    ) : (
                        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                            {appName}
                        </h1>
                    )}
                    <p className="text-[10px] font-black text-slate-500 mt-2 uppercase tracking-[0.2em]">Super Admin Panel</p>
                </div>
                <nav className="flex-1 px-4 space-y-1 mt-4">
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors">
                        <LayoutDashboard size={20} />
                        <span className="text-xs font-bold uppercase tracking-widest">Dashboard</span>
                    </Link>
                    <Link href="/admin/companies" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors">
                        <Building2 size={20} />
                        <span className="text-xs font-bold uppercase tracking-widest">Empresas</span>
                    </Link>
                    <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors">
                        <Users size={20} />
                        <span className="text-xs font-bold uppercase tracking-widest">Usuarios</span>
                    </Link>
                    <Link href="/admin/plans" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors">
                        <Package size={20} />
                        <span className="text-xs font-bold uppercase tracking-widest">Planes</span>
                    </Link>
                    <Link href="/admin/billing" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors">
                        <CreditCard size={20} />
                        <span className="text-xs font-bold uppercase tracking-widest">Facturación</span>
                    </Link>
                    <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors">
                        <Settings size={20} />
                        <span className="text-xs font-bold uppercase tracking-widest">Configuración</span>
                    </Link>

                </nav>
                <div className="p-8 border-t border-slate-800 space-y-4">
                    <div className="px-4 py-1">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Administrador</p>
                        <p className="text-sm font-bold text-slate-200 truncate">{profile?.full_name}</p>
                    </div>
                    <LogoutButton variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 text-[10px] font-bold uppercase tracking-widest" />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
                <div className="flex-1 p-0 md:p-8 pb-32 md:pb-8">
                    {children}
                </div>
            </main>
        </div>
    )
}

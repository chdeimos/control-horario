import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogoutButton } from '@/components/features/logout-button'
import {
    User,
    Settings,
    LayoutDashboard,
    Users,
    Clock,
    AlertTriangle,
    PieChart,
    Palmtree,
    LogOut
} from 'lucide-react'
import { GestionSideNav } from './side-nav'
import { GestionBottomNav } from './bottom-nav'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/gestion/login')
    }

    // Obtener perfil completo con empresa y departamento
    const { data: profile } = await supabase
        .from('profiles')
        .select(`
            id, 
            full_name, 
            role, 
            is_active,
            company_id,
            department_id,
            companies (name, is_active, logo_web_url, logo_app_url, logo_large_url),
            departments (name)
        `)
        .eq('id', user.id)
        .single()

    if (!profile) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="text-center p-8 bg-white rounded-lg border border-slate-100 shadow-xl max-w-md">
                    <h1 className="text-2xl font-black text-red-600 uppercase tracking-tighter">Perfil no encontrado</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-4">Tu usuario no tiene un perfil asociado. Contacta con soporte técnico.</p>
                </div>
            </div>
        )
    }

    // @ts-ignore - Handle Supabase joins
    const company = Array.isArray(profile.companies) ? profile.companies[0] : profile.companies

    // Verificación de Acceso: Perfil o Empresa desactivados
    if (profile.role !== 'super_admin') {
        if (!profile.is_active) {
            return (
                <div className="flex h-screen items-center justify-center bg-slate-50">
                    <div className="text-center p-12 bg-white rounded-lg border border-slate-100 shadow-2xl max-w-lg">
                        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-2xl font-black">!</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Cuenta Suspendida</h1>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-4 leading-relaxed">
                            Tu acceso a la plataforma ha sido revocado.
                            <br />Contacta con el administrador de tu empresa para más detalles.
                        </p>
                        <div className="mt-8">
                            <LogoutButton variant="outline" className="rounded-lg font-black text-[10px] uppercase tracking-widest h-12 px-8" />
                        </div>
                    </div>
                </div>
            )
        }

        if (company && !company.is_active) {
            return (
                <div className="flex h-screen items-center justify-center bg-slate-50">
                    <div className="text-center p-12 bg-white rounded-lg border border-slate-100 shadow-2xl max-w-lg">
                        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-2xl font-black">!</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Servicio Interrumpido</h1>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-4 leading-relaxed">
                            El acceso de la empresa <span className="text-slate-900">"{company.name}"</span> ha sido desactivado globalmente.
                            <br />Contacta con el departamento de administración.
                        </p>
                        <div className="mt-8">
                            <LogoutButton variant="outline" className="rounded-lg font-black text-[10px] uppercase tracking-widest h-12 px-8" />
                        </div>
                    </div>
                </div>
            )
        }
    }
    const companyName = company?.name || 'Empresa'

    // @ts-ignore
    const department = Array.isArray(profile.departments) ? profile.departments[0] : profile.departments
    const departmentName = department?.name || 'Sin Departamento'

    const logoUrl = company?.logo_web_url

    return (
        <div className="flex h-screen bg-[#f3f4f9] font-manrope selection:bg-blue-50 selection:text-[#3b60c1] overflow-hidden">
            {/* Desktop Sidebar - Premium Style */}
            <aside className="w-80 bg-white border-r border-slate-100 hidden md:flex flex-col">
                {/* Logo Section */}
                <div className="pt-10 pb-4 px-8 flex items-center">
                    <Link href="/gestion" className="block hover:opacity-80 transition-opacity">
                        {logoUrl ? (
                            <img src={logoUrl} alt={companyName} className="h-10 w-auto object-contain" />
                        ) : (
                            <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">{companyName}</h1>
                        )}
                    </Link>
                </div>

                {/* Navigation Menu */}
                <GestionSideNav role={profile.role} departmentId={profile.department_id} />

                {/* User Section at Bottom */}
                <div className="p-6 mt-auto">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.05)] mb-4 text-[#3b60c1]">
                            <User size={28} strokeWidth={1.5} />
                        </div>

                        <div className="text-center mb-6">
                            <p className="text-base font-bold text-slate-900 tracking-tight leading-tight px-1">{profile.full_name}</p>
                            <p className="text-[10px] font-black text-[#3b60c1] uppercase tracking-[0.2em] mt-1">{departmentName}</p>
                        </div>

                        <div className="w-full space-y-4">
                            <Link
                                href="/fichaje"
                                className="w-full h-12 bg-[#3b60c1] hover:bg-[#2d4a94] text-white rounded-xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-blue-100 transition-all active:scale-[0.97]"
                            >
                                <Clock size={18} />
                                Fichar
                            </Link>

                            <div className="flex flex-col items-center pt-2">
                                <LogoutButton variant="ghost" className="w-full flex items-center justify-center gap-3 text-slate-400 hover:text-slate-900 h-auto p-0 text-[10px] font-bold uppercase tracking-widest bg-transparent hover:bg-transparent shadow-none border-0">
                                    <LogOut size={18} strokeWidth={2} className="rotate-180" />
                                    CERRAR SESIÓN
                                </LogoutButton>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
                {/* Mobile App Header - Matching /fichaje style */}
                <header className="md:hidden bg-white px-6 pt-8 pb-3 text-center space-y-2 border-b-0">
                    <div className="flex flex-col items-center">
                        {logoUrl ? (
                            <img src={logoUrl} alt={companyName} className="h-8 w-auto object-contain mb-1" />
                        ) : (
                            <h1 className="text-2xl font-black text-[#1e293b] tracking-tighter uppercase">{companyName}</h1>
                        )}
                        <p className="text-slate-600 text-sm font-medium">Panel de Gestión 👋</p>
                    </div>

                    {/* Blue Info Bar */}
                    <div className="bg-[#3b60c1] text-white py-2.5 px-6 -mx-6 mt-4 flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-widest shadow-md">
                        <span className="opacity-80">MODO ADMINISTRACIÓN</span>
                        <div className="w-[1px] h-3 bg-white/20"></div>
                        <div className="flex items-center gap-1.5">
                            <Settings size={12} strokeWidth={3} />
                            <span>{profile.role.replace('_', ' ')}</span>
                        </div>
                    </div>
                </header>

                <div className="w-full p-0 md:p-12 pb-32 md:pb-12">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <GestionBottomNav role={profile.role} />
        </div>
    )
}

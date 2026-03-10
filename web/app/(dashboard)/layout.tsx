import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogoutButton } from '@/components/features/logout-button'

// @force-rebuild
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
        redirect('/login')
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
        <div className="flex h-screen bg-gray-100 selection:bg-blue-50 selection:text-[#3b60c1]">
            {/* Sidebar Placeholder */}
            <aside className="w-80 bg-white border-r border-slate-100 hidden md:flex flex-col shrink-0">
                <div className="p-10 px-8 flex items-center">
                    {logoUrl ? (
                        <img src={logoUrl} alt={companyName} className="h-8 w-auto object-contain" />
                    ) : (
                        <h1 className="text-xl font-bold">Control Horario</h1>
                    )}
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <Link href="/dashboard" className="block p-2 hover:bg-slate-100 rounded-lg transition-colors">Inicio</Link>
                    {['company_admin', 'manager'].includes(profile.role) && (
                        <Link href="/employees" className="block p-2 hover:bg-slate-100 rounded-lg text-primary font-bold">Empleados</Link>
                    )}
                    {['company_admin', 'manager', 'super_admin'].includes(profile.role) && (
                        <Link href="/registry" className="block p-2 hover:bg-slate-100 rounded-lg">Registro</Link>
                    )}
                    {['company_admin', 'manager', 'super_admin'].includes(profile.role) && (
                        <Link href="/incidents" className="block p-2 hover:bg-slate-100 rounded-lg text-amber-600 font-bold">Incidencias</Link>
                    )}
                    <Link href="/time-entries" className="block p-2 hover:bg-slate-100 rounded-lg">Fichajes</Link>
                    <Link href="/time-off" className="block p-2 hover:bg-slate-100 rounded-lg">Ausencias</Link>
                    <Link href="/reports" className="block p-2 hover:bg-slate-100 rounded-lg">Informes</Link>
                    {profile.role === 'company_admin' && (
                        <Link href="/settings" className="block p-2 hover:bg-slate-100 rounded-lg text-slate-700">Configuración</Link>
                    )}
                </nav>

                <div className="p-4 border-t bg-slate-50/50 space-y-4">
                    <div className="px-2">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{companyName}</p>
                            <p className="text-[10px] text-primary font-semibold uppercase">{departmentName}</p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-xs text-slate-500 font-medium">Usuario</p>
                            <p className="text-sm font-bold text-slate-900 truncate">{profile.full_name}</p>
                        </div>
                    </div>
                    <LogoutButton variant="outline" className="w-full justify-start border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg shadow-sm" />
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

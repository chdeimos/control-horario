"use client";

import { createClient } from '@/lib/supabase/client'
import { redirect, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LogoutButton } from '@/components/features/logout-button'
import { Home, Clock, Calendar, LogOut, LayoutGrid, User } from 'lucide-react'
import { SideNav } from '@/components/shared/side-nav'
import { useEffect, useState } from 'react'

// @force-rebuild
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [settings, setSettings] = useState<any>({})
    const [scheduleText, setScheduleText] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [mounted, setMounted] = useState(false)
    const pathname = usePathname()
    const supabase = createClient()

    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                redirect('/login')
                return
            }
            setUser(user)

            const today = new Date().toISOString().split('T')[0]
            const [profileRes, settingsRes, todayScheduleRes] = await Promise.all([
                supabase
                    .from('profiles')
                    .select(`
                        id, 
                        full_name, 
                        role, 
                        is_active,
                        company_id,
                        department_id,
                        schedule_type,
                        companies (name, is_active, logo_web_url, logo_app_url, logo_large_url),
                        departments (name)
                    `)
                    .eq('id', user.id)
                    .single(),
                supabase.from('system_settings').select('*'),
                supabase
                    .from('work_schedules')
                    .select('*')
                    .eq('profile_id', user.id)
                    .eq('day_of_week', new Date().getDay() || 7)
                    .maybeSingle()
            ])

            if (profileRes.data) {
                setProfile(profileRes.data)
            }

            if (settingsRes.data) {
                const settingsObj = settingsRes.data.reduce((acc: any, item: any) => {
                    acc[item.key] = item.value
                    return acc
                }, {})
                setSettings(settingsObj)
            }

            if (todayScheduleRes.data) {
                const s = todayScheduleRes.data
                const isFixed = profileRes.data?.schedule_type === 'fixed'

                if (isFixed && s.start_time && s.end_time) {
                    setScheduleText(`${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)}`)
                } else if (!isFixed && s.target_total_hours) {
                    setScheduleText(`OBJETIVO: ${s.target_total_hours} HORAS`)
                }
            }

            setLoading(false)
        }
        loadData()
        setMounted(true)
    }, [])

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b60c1]"></div>
        </div>
    }

    if (!profile) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="text-center p-8 bg-white rounded-[5px] shadow-xl border border-slate-100 max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-[5px] flex items-center justify-center mx-auto mb-4">
                        <LogOut size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Acceso Denegado</h1>
                    <p className="text-slate-500 font-medium text-sm">No hemos podido encontrar tu perfil. Por favor, contacta con soporte.</p>
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
                <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
                    <div className="text-center p-12 bg-white rounded-lg border border-slate-100 shadow-2xl max-w-lg w-full">
                        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-2xl font-black">!</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Cuenta Suspendida</h1>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-4 leading-relaxed">
                            Tu acceso a la plataforma ha sido revocado.
                            <br />Contacta con el administrador de tu empresa para más detalles.
                        </p>
                        <div className="mt-10">
                            <LogoutButton variant="outline" className="rounded-lg font-black text-[10px] uppercase tracking-widest h-14 px-10 w-full" />
                        </div>
                    </div>
                </div>
            )
        }

        if (company && !company.is_active) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
                    <div className="text-center p-12 bg-white rounded-lg border border-slate-100 shadow-2xl max-w-lg w-full">
                        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-2xl font-black">!</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Servicio Interrumpido</h1>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-4 leading-relaxed">
                            El acceso de la empresa <span className="text-slate-900">"{company.name}"</span> ha sido desactivado globalmente.
                            <br />Contacta con el departamento de administración de D105.
                        </p>
                        <div className="mt-10">
                            <LogoutButton variant="outline" className="rounded-lg font-black text-[10px] uppercase tracking-widest h-14 px-10 w-full" />
                        </div>
                    </div>
                </div>
            )
        }
    }

    const companyName = company?.name || 'ControlPro'
    // @ts-ignore
    const department = Array.isArray(profile.departments) ? profile.departments[0] : profile.departments
    const departmentName = department?.name || 'Sin Departamento'
    const logoUrl = company?.logo_web_url
    const platformName = settings?.app_name || 'ControlPro'

    return (
        <div className="flex h-screen bg-[#f3f4f9] font-sans selection:bg-blue-50 selection:text-[#3b60c1] overflow-hidden">
            {/* Desktop Sidebar - PandoraSoft Style */}
            <aside className="w-80 bg-white border-r border-slate-100 hidden md:flex flex-col">
                {/* Logo Section */}
                <div className="p-10 px-8 flex items-center">
                    {logoUrl ? (
                        <img src={logoUrl} alt={companyName} className="h-10 w-auto object-contain" />
                    ) : (
                        <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">{companyName}</h1>
                    )}
                </div>

                {/* Navigation Menu */}
                <SideNav />

                {/* User Section at Bottom */}
                <div className="p-6 mt-auto">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 flex flex-col items-center">
                        {/* Avatar container matching image */}
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.05)] mb-4 text-[#3b60c1]">
                            <User size={28} strokeWidth={1.5} />
                        </div>

                        <div className="text-center mb-6">
                            <p className="text-base font-bold text-slate-900 tracking-tight leading-tight">{profile.full_name}</p>
                            <p className="text-[10px] font-bold text-[#3b60c1] uppercase tracking-[0.15em] mt-1">{departmentName}</p>
                        </div>

                        <div className="w-full space-y-4">
                            {/* Main Action Button: Only for Admins/Managers to switch context */}
                            {['company_admin', 'manager', 'super_admin'].includes(profile.role) && (
                                <Link
                                    href="/gestion"
                                    className="w-full h-12 bg-[#3b60c1] hover:bg-[#2d4a94] text-white rounded-xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-blue-100 transition-all active:scale-[0.97]"
                                >
                                    <LayoutGrid size={18} />
                                    Gestión
                                </Link>
                            )}

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
            <main className="flex-1 overflow-y-auto relative">
                {/* Mobile App Header - PandoraSoft Redesign */}
                <header className="md:hidden bg-white px-6 pt-8 pb-3 text-center space-y-2 border-b-0">
                    <div className="flex flex-col items-center">
                        {logoUrl ? (
                            <img src={logoUrl} alt={companyName} className="h-8 w-auto object-contain mb-1" />
                        ) : (
                            <h1 className="text-2xl font-black text-[#1e293b] tracking-tighter uppercase">{companyName}</h1>
                        )}
                        <p className="text-slate-600 text-sm font-medium">¡Hola, {profile.full_name.split(' ')[0].toLowerCase()}! 👋</p>
                    </div>

                    {/* Blue Date/Schedule Bar */}
                    <div className="bg-[#3b60c1] text-white py-2.5 px-6 -mx-6 mt-4 flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-widest shadow-md" suppressHydrationWarning>
                        <span className="opacity-80">{mounted ? new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '-- --'}</span>
                        <div className="w-[1px] h-3 bg-white/20"></div>
                        <div className="flex items-center gap-1.5">
                            <Clock size={12} strokeWidth={3} />
                            <span>
                                {profile.schedule_type === 'fixed'
                                    ? (scheduleText ? `HORARIO: ${scheduleText}` : 'SIN HORARIO ASIGNADO')
                                    : (scheduleText ? `${scheduleText}` : 'SIN JORNADA ASIGNADA')
                                }
                            </span>
                        </div>
                    </div>
                </header>

                <div className="w-full p-0 md:p-12 pb-32 md:pb-12">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation - PandoraSoft Style */}
            <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#0f172a] border-t border-white/5 flex items-center justify-around px-2 md:hidden z-[100]">
                <Link href="/fichaje" className={`flex flex-col items-center gap-1 group py-2 flex-1 ${pathname === '/fichaje' ? '' : 'opacity-40'}`}>
                    <Home size={22} className={`${pathname === '/fichaje' ? 'text-[#3b60c1] drop-shadow-[0_0_8px_rgba(59,96,193,0.5)]' : 'text-white'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${pathname === '/fichaje' ? 'text-[#3b60c1]' : 'text-white'}`}>Inicio</span>
                </Link>
                <Link href="/fichaje/time-entries" className={`flex flex-col items-center gap-1 group py-2 flex-1 ${pathname === '/fichaje/time-entries' ? '' : 'opacity-40'}`}>
                    <Clock size={22} className={`${pathname === '/fichaje/time-entries' ? 'text-[#3b60c1] drop-shadow-[0_0_8px_rgba(59,96,193,0.5)]' : 'text-white'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${pathname === '/fichaje/time-entries' ? 'text-[#3b60c1]' : 'text-white'}`}>Fichajes</span>
                </Link>
                <Link href="/fichaje/dias-libres" className={`flex flex-col items-center gap-1 group py-2 flex-1 ${pathname === '/fichaje/dias-libres' ? '' : 'opacity-40'}`}>
                    <Calendar size={22} className={`${pathname === '/fichaje/dias-libres' ? 'text-[#3b60c1] drop-shadow-[0_0_8px_rgba(59,96,193,0.5)]' : 'text-white'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${pathname === '/fichaje/dias-libres' ? 'text-[#3b60c1]' : 'text-white'}`}>Días</span>
                </Link>
                <div className="flex flex-col items-center flex-1 opacity-40">
                    <LogoutButton variant="ghost" className="flex flex-col items-center gap-1 p-0 h-auto hover:bg-transparent active:bg-transparent">
                        <User size={22} className="text-white" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Cerrar Sesión</span>
                    </LogoutButton>
                </div>
            </nav>
        </div>
    )
}

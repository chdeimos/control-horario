import { Suspense } from 'react'
import { createAdminClient } from "@/lib/supabase/admin"
import { Loader2 } from 'lucide-react'
import VerifyForm from './verify-form'

export default async function VerifyPage() {
    const adminSupabase = createAdminClient()

    // Fetch SaaS Branding using Admin Client to bypass RLS
    const { data: settingsData } = await adminSupabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['app_name', 'saas_logo_web'])

    const settings = (settingsData || []).reduce((acc: any, item: any) => {
        acc[item.key] = item.value
        return acc
    }, {})

    const branding = {
        appName: settings.app_name || 'ControlPro',
        logoUrl: settings.saas_logo_web
    }

    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center p-20 gap-6">
                <div className="h-12 w-12 border-4 border-slate-100 border-t-[#3b60c1] rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Protegiendo tu sesión...</p>
            </div>
        }>
            <VerifyForm branding={branding} />
        </Suspense>
    )
}


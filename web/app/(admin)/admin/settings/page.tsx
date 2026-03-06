import { createClient } from '@/lib/supabase/server'
import { getSettings } from './actions'
import { ProfileForm } from './profile-form'
import { SettingsForm } from './settings-form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BackupTab } from './backup-tab'
import { Settings, UserCircle, Database } from 'lucide-react'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()
    const { data: settings, error } = await getSettings()

    if (error) return <div className="p-8 text-red-500">Error: {error}</div>

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Configuración del Sistema</h2>
                <p className="text-muted-foreground">Gestiona los parámetros globales, seguridad y copias de seguridad.</p>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="bg-slate-100 p-1">
                    <TabsTrigger value="general" className="gap-2">
                        <UserCircle className="h-4 w-4" />
                        Mi Perfil
                    </TabsTrigger>
                    <TabsTrigger value="system" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Sistema
                    </TabsTrigger>
                    <TabsTrigger value="backup" className="gap-2">
                        <Database className="h-4 w-4" />
                        Copia de Seguridad
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <div className="max-w-3xl">
                        <ProfileForm profile={profile} userEmail={user?.email || ''} />
                    </div>
                </TabsContent>

                <TabsContent value="system">
                    <div className="max-w-2xl">
                        <SettingsForm settings={settings} />
                    </div>
                </TabsContent>

                <TabsContent value="backup">
                    <BackupTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}

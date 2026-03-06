'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { updateBulkSettings } from './actions'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/shared/image-upload'
import { Building2, Palette, Globe, Mail, Loader2, Save } from 'lucide-react'

export function SettingsForm({ settings }: { settings: any }) {
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        app_name: settings.app_name || 'Control Horario SaaS',
        billing_email: settings.billing_email || '',
        saas_name: settings.saas_name || '',
        saas_cif: settings.saas_cif || '',
        saas_address: settings.saas_address || '',
        saas_email: settings.saas_email || '',
        saas_phone: settings.saas_phone || '',
        saas_logo_large: settings.saas_logo_large || '',
        saas_logo_app: settings.saas_logo_app || '',
        saas_logo_web: settings.saas_logo_web || '',
        saas_favicon: settings.saas_favicon || '',
    })

    async function handleSave() {
        setLoading(true)
        const res = await updateBulkSettings(form)
        setLoading(false)

        if (res.error) {
            toast.error(`Error: ${res.error}`)
        } else {
            toast.success('Configuración guardada correctamente')
        }
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Información de la Empresa SaaS */}
            <Card>
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <CardTitle>Datos de la Empresa SaaS</CardTitle>
                    </div>
                    <CardDescription>Información legal y de contacto del proveedor del servicio.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="saas_name">Razon Social</Label>
                            <Input
                                id="saas_name"
                                value={form.saas_name}
                                onChange={(e) => setForm({ ...form, saas_name: e.target.value })}
                                placeholder="Tu Empresa SaaS S.L."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="saas_cif">CIF / NIF</Label>
                            <Input
                                id="saas_cif"
                                value={form.saas_cif}
                                onChange={(e) => setForm({ ...form, saas_cif: e.target.value })}
                                placeholder="B00000000"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="saas_address">Dirección</Label>
                            <Input
                                id="saas_address"
                                value={form.saas_address}
                                onChange={(e) => setForm({ ...form, saas_address: e.target.value })}
                                placeholder="Calle Mayor 1, Madrid"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="saas_email">Email Soporte</Label>
                            <Input
                                id="saas_email"
                                value={form.saas_email}
                                onChange={(e) => setForm({ ...form, saas_email: e.target.value })}
                                placeholder="soporte@saas.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="saas_phone">Teléfono</Label>
                            <Input
                                id="saas_phone"
                                value={form.saas_phone}
                                onChange={(e) => setForm({ ...form, saas_phone: e.target.value })}
                                placeholder="+34 900 000 000"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Branding del Sistema */}
            <Card>
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-purple-600" />
                        <CardTitle>Branding Global del SaaS</CardTitle>
                    </div>
                    <CardDescription>Personaliza la apariencia general de la plataforma.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="app_name">Nombre de la Aplicación</Label>
                        <Input
                            id="app_name"
                            value={form.app_name}
                            onChange={(e) => setForm({ ...form, app_name: e.target.value })}
                            className="font-semibold text-lg"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <ImageUpload
                            label="Logo Web (Sidebar)"
                            value={form.saas_logo_web}
                            onChange={(url) => setForm({ ...form, saas_logo_web: url })}
                            path="saas/branding"
                        />
                        <ImageUpload
                            label="Logo App (Móvil)"
                            value={form.saas_logo_app}
                            onChange={(url) => setForm({ ...form, saas_logo_app: url })}
                            path="saas/branding"
                        />
                        <ImageUpload
                            label="Logo Grande (Admin)"
                            value={form.saas_logo_large}
                            onChange={(url) => setForm({ ...form, saas_logo_large: url })}
                            path="saas/branding"
                        />
                        <ImageUpload
                            label="Favicon"
                            value={form.saas_favicon}
                            onChange={(url) => setForm({ ...form, saas_favicon: url })}
                            path="saas/branding"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Configuración de Notificaciones */}
            <Card>
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-green-600" />
                        <CardTitle>Notificaciones y Facturación</CardTitle>
                    </div>
                    <CardDescription>Configura los correos de administración interna.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="billing_email">Email Facturación</Label>
                        <Input
                            id="billing_email"
                            type="email"
                            value={form.billing_email}
                            onChange={(e) => setForm({ ...form, billing_email: e.target.value })}
                            placeholder="admin@tuempresa.com"
                        />
                        <p className="text-xs text-muted-foreground italic">Este correo recibirá avisos automáticos del sistema.</p>
                    </div>
                </CardContent>
                <CardFooter className="pt-6 border-t bg-slate-50/30 flex justify-end">
                    <Button onClick={handleSave} disabled={loading} className="gap-2 h-11 px-8">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {loading ? 'Guardando...' : 'Guardar Todo'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

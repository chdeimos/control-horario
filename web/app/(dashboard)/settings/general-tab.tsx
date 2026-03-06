'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { updateCompanySettings } from './actions'
import { toast } from 'sonner'
import { Loader2, Save, Building2, MapPin, Mail, Phone, Image as ImageIcon } from 'lucide-react'

interface CompanyData {
    name: string
    cif: string
    address?: string
    email?: string
    phone?: string
    logo_large_url?: string
    logo_app_url?: string
    logo_web_url?: string
    settings: {
        default_vacation_days?: number
        default_personal_days?: number
    }
}

import { ImageUpload } from '@/components/shared/image-upload'

export function GeneralTab({ company }: { company: any }) {
    const [loading, setLoading] = useState(false)
    const [logos, setLogos] = useState({
        large: company?.logo_large_url || '',
        app: company?.logo_app_url || '',
        web: company?.logo_web_url || ''
    })

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        // Add logos from state since they are managed by ImageUpload
        formData.set('logo_large_url', logos.large)
        formData.set('logo_app_url', logos.app)
        formData.set('logo_web_url', logos.web)

        const res = await updateCompanySettings(formData)

        setLoading(false)
        if (res.error) {
            toast.error(`Error: ${res.error}`)
        } else {
            toast.success('Configuración actualizada correctamente')
        }
    }

    const settings = company?.settings || {}

    return (
        <div className="space-y-6 max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Hidden Inputs for Logos */}
                <input type="hidden" name="logo_large_url" value={logos.large} />
                <input type="hidden" name="logo_app_url" value={logos.app} />
                <input type="hidden" name="logo_web_url" value={logos.web} />

                {/* Datos de la Empresa */}
                <Card>
                    <CardHeader className="border-b bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            <CardTitle>Datos de la Empresa</CardTitle>
                        </div>
                        <CardDescription>
                            Información fiscal y de contacto oficial de la empresa.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre de la Empresa</Label>
                                <Input id="name" name="name" defaultValue={company?.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cif">CIF / NIF</Label>
                                <Input id="cif" name="cif" defaultValue={company?.cif} required />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    Dirección Física
                                </Label>
                                <Input id="address" name="address" defaultValue={company?.address} placeholder="Calle, Número, Ciudad, CP" />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    Email de Contacto
                                </Label>
                                <Input id="email" name="email" type="email" defaultValue={company?.email} placeholder="admin@empresa.com" />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    Teléfono
                                </Label>
                                <Input id="phone" name="phone" defaultValue={company?.phone} placeholder="+34 000 000 000" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Branding y Logos */}
                <Card>
                    <CardHeader className="border-b bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-purple-600" />
                            <CardTitle>Branding y Logos</CardTitle>
                        </div>
                        <CardDescription>
                            Personaliza la apariencia de la plataforma con tus logos oficiales.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <ImageUpload
                                label="Logo Grande (Landing)"
                                value={logos.large}
                                onChange={(url) => setLogos(prev => ({ ...prev, large: url }))}
                                path={`branding/${company?.id}/large`}
                            />
                            <ImageUpload
                                label="Logo App (Móvil)"
                                value={logos.app}
                                onChange={(url) => setLogos(prev => ({ ...prev, app: url }))}
                                path={`branding/${company?.id}/app`}
                            />
                            <ImageUpload
                                label="Logo Web (Barra Nav)"
                                value={logos.web}
                                onChange={(url) => setLogos(prev => ({ ...prev, web: url }))}
                                path={`branding/${company?.id}/web`}
                            />
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-[10px] text-muted-foreground italic">
                            <p>Recomendado: Fondo transparente, 512x512px</p>
                            <p>Recomendado: Cuadrado, 192x192px</p>
                            <p>Recomendado: Horizontal, 200x50px</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Configuración Global */}
                <Card>
                    <CardHeader className="border-b bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <Save className="h-5 w-5 text-green-600" />
                            <CardTitle>Configuración de RRHH</CardTitle>
                        </div>
                        <CardDescription>
                            Valores predeterminados para la gestión de ausencias y vacaciones.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="default_vacation_days">Vacaciones Anuales (Días)</Label>
                                <Input
                                    id="default_vacation_days"
                                    name="default_vacation_days"
                                    type="number"
                                    defaultValue={settings?.default_vacation_days ?? 22}
                                    min="0"
                                />
                                <p className="text-xs text-muted-foreground">Normalmente 22 días laborables o 30 naturales.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="default_personal_days">Días Libre Disp. (Asuntos Propios)</Label>
                                <Input
                                    id="default_personal_days"
                                    name="default_personal_days"
                                    type="number"
                                    defaultValue={settings?.default_personal_days ?? 0}
                                    min="0"
                                />
                                <p className="text-xs text-muted-foreground">Días de libre disposición según convenio.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={loading} className="gap-2 h-12 px-8 text-lg bg-blue-600 hover:bg-blue-700">
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        Guardar Toda la Configuración
                    </Button>
                </div>
            </form>
        </div>
    )
}

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
        web: company?.logo_web_url || '',
        kiosk: company?.settings?.kiosk_image_url || ''
    })

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        // Add logos from state since they are managed by ImageUpload
        formData.set('logo_large_url', logos.large)
        formData.set('logo_app_url', logos.app)
        formData.set('logo_web_url', logos.web)
        formData.set('logo_kiosk_url', logos.kiosk)

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
        <div className="max-w-4xl space-y-12">
            <form onSubmit={handleSubmit} className="space-y-12">
                {/* Hidden Inputs for Logos */}
                <input type="hidden" name="logo_large_url" value={logos.large} />
                <input type="hidden" name="logo_app_url" value={logos.app} />
                <input type="hidden" name="logo_web_url" value={logos.web} />
                <input type="hidden" name="logo_kiosk_url" value={logos.kiosk} />

                {/* Datos de la Empresa */}
                <div className="bg-white rounded-lg border border-slate-100 shadow-2xl shadow-slate-900/5 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-1 bg-[#3b60c1] rounded-full"></div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Datos de la Empresa</h3>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2 ml-4">Información fiscal y de contacto oficial</p>
                    </div>
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label htmlFor="name" className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Nombre de la Empresa</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={company?.name}
                                    required
                                    className="h-12 bg-white border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 shadow-sm transition-all"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="cif" className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">CIF / NIF</Label>
                                <Input
                                    id="cif"
                                    name="cif"
                                    defaultValue={company?.cif}
                                    required
                                    className="h-12 bg-white border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 shadow-sm transition-all"
                                />
                            </div>
                            <div className="space-y-3 md:col-span-2">
                                <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1 flex items-center gap-2">
                                    <MapPin className="h-3 w-3" /> Dirección Física
                                </Label>
                                <Input
                                    id="address"
                                    name="address"
                                    defaultValue={company?.address}
                                    placeholder="Calle, Número, Ciudad, CP"
                                    className="h-12 bg-white border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 shadow-sm transition-all"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1 flex items-center gap-2">
                                    <Mail className="h-3 w-3" /> Email de Contacto
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={company?.email}
                                    placeholder="admin@empresa.com"
                                    className="h-12 bg-white border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 shadow-sm transition-all"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1 flex items-center gap-2">
                                    <Phone className="h-3 w-3" /> Teléfono
                                </Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    defaultValue={company?.phone}
                                    placeholder="+34 000 000 000"
                                    className="h-12 bg-white border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 shadow-sm transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Branding y Logos */}
                <div className="bg-white rounded-lg border border-slate-100 shadow-2xl shadow-slate-900/5 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-1 bg-amber-500 rounded-full"></div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Branding y Activos</h3>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2 ml-4">Identidad visual de la plataforma corporativa</p>
                    </div>
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <div className="space-y-4">
                                <ImageUpload
                                    label="Logo Principal"
                                    value={logos.large}
                                    onChange={(url) => setLogos(prev => ({ ...prev, large: url }))}
                                    path={`branding/${company?.id}/large`}
                                />
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 text-center">SVG / PNG Transparente</p>
                            </div>
                            <div className="space-y-4">
                                <ImageUpload
                                    label="Icono App"
                                    value={logos.app}
                                    onChange={(url) => setLogos(prev => ({ ...prev, app: url }))}
                                    path={`branding/${company?.id}/app`}
                                />
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 text-center">Cuadrado 512x512</p>
                            </div>
                            <div className="space-y-4">
                                <ImageUpload
                                    label="Logo Web"
                                    value={logos.web}
                                    onChange={(url) => setLogos(prev => ({ ...prev, web: url }))}
                                    path={`branding/${company?.id}/web`}
                                />
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 text-center">Horizontal 200x50</p>
                            </div>
                            <div className="space-y-4">
                                <ImageUpload
                                    label="Imagen Tablet (1:1)"
                                    value={logos.kiosk}
                                    onChange={(url) => setLogos(prev => ({ ...prev, kiosk: url }))}
                                    path={`branding/${company?.id}/kiosk`}
                                />
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 text-center">Cuadrado Tablet</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Configuración de RRHH */}
                <div className="bg-white rounded-lg border border-slate-100 shadow-2xl shadow-slate-900/5 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-1 bg-emerald-600 rounded-full"></div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Política de RRHH</h3>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2 ml-4">Valores predeterminados para el equipo</p>
                    </div>
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label htmlFor="default_vacation_days" className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Vacaciones Anuales (Días)</Label>
                                <Input
                                    id="default_vacation_days"
                                    name="default_vacation_days"
                                    type="number"
                                    defaultValue={settings?.default_vacation_days ?? 22}
                                    min="0"
                                    className="h-12 bg-white border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 shadow-sm transition-all"
                                />
                                <p className="text-[10px] font-medium text-slate-400 ml-1">Referencia estándar: 22 laborables / 30 naturales.</p>
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="default_personal_days" className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Días Asuntos Propios</Label>
                                <Input
                                    id="default_personal_days"
                                    name="default_personal_days"
                                    type="number"
                                    defaultValue={settings?.default_personal_days ?? 0}
                                    min="0"
                                    className="h-12 bg-white border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 shadow-sm transition-all"
                                />
                                <p className="text-[10px] font-medium text-slate-400 ml-1">Días de libre disposición según convenio vigente.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Configuración de Control Horario */}
                <div className="bg-white rounded-lg border border-slate-100 shadow-2xl shadow-slate-900/5 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-1 bg-[#3b60c1] rounded-full"></div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Control de Incidencias</h3>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2 ml-4">Lógica del sistema de detección de fraudes y errores</p>
                    </div>
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label htmlFor="incident_margin_minutes" className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Margen de Incidencia (Minutos)</Label>
                                <Input
                                    id="incident_margin_minutes"
                                    name="incident_margin_minutes"
                                    type="number"
                                    defaultValue={settings?.incident_margin_minutes ?? 30}
                                    min="0"
                                    className="h-12 bg-white border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 shadow-sm transition-all"
                                />
                                <p className="text-[10px] font-medium text-slate-400 ml-1">Tiempo de cortesía permitido antes de generar una incidencia automática por retraso/adelanto.</p>
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="auto_clock_out_hours" className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Cierre Automático (Horas)</Label>
                                <Input
                                    id="auto_clock_out_hours"
                                    name="auto_clock_out_hours"
                                    type="number"
                                    defaultValue={settings?.auto_clock_out_hours ?? 12}
                                    min="1"
                                    className="h-12 bg-white border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 shadow-sm transition-all"
                                />
                                <p className="text-[10px] font-medium text-slate-400 ml-1">Si un empleado olvida salir, el sistema finalizará el registro tras N horas de actividad continua.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-6">
                    <Button
                        type="submit"
                        disabled={loading}
                        className="h-12 px-10 bg-[#3b60c1] hover:bg-[#2d4a94] text-white rounded-lg font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 group active:scale-95"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                                Guardar Cambios
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}

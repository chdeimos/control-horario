'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateBulkSettings } from './actions'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/shared/image-upload'
import { Building2, Palette, Globe, Mail, Loader2, Save, Sparkles, Layout, Smartphone, Scale } from 'lucide-react'

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
        saas_website: settings.saas_website || '',
        saas_logo_large: settings.saas_logo_large || '',
        saas_logo_app: settings.saas_logo_app || '',
        saas_logo_web: settings.saas_logo_web || '',
        saas_logo_pdf: settings.saas_logo_pdf || '',
        saas_favicon: settings.saas_favicon || '',
        saas_legal_text: settings.saas_legal_text || '',
    })

    async function handleSave() {
        setLoading(true)
        const res = await updateBulkSettings(form)
        setLoading(false)

        if (res.error) {
            toast.error(`Error: ${res.error}`)
        } else {
            toast.success('Configuración global guardada correctamente')
        }
    }

    return (
        <div className="space-y-12 max-w-4xl pb-20">
            {/* Información de la Empresa SaaS - White Surface Card */}
            <div className="bg-white rounded-lg border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden group">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-[#3b60c1]">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Datos de Empresa</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Identidad legal y parámetros de facturación raíz</p>
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                            <Label htmlFor="saas_name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Razón Social</Label>
                            <Input
                                id="saas_name"
                                value={form.saas_name}
                                onChange={(e) => setForm({ ...form, saas_name: e.target.value })}
                                placeholder="IDENTIFICADOR_LEGAL_SL"
                                className="bg-slate-50 border-slate-100 rounded-lg h-14 focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all font-bold text-slate-900"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="saas_cif" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Identificador Fiscal (CIF)</Label>
                            <Input
                                id="saas_cif"
                                value={form.saas_cif}
                                onChange={(e) => setForm({ ...form, saas_cif: e.target.value })}
                                placeholder="B00000000"
                                className="bg-slate-50 border-slate-100 rounded-lg h-14 focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all font-bold text-slate-900"
                            />
                        </div>
                        <div className="space-y-3 md:col-span-2">
                            <Label htmlFor="saas_address" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Ubicación de Sede</Label>
                            <Input
                                id="saas_address"
                                value={form.saas_address}
                                onChange={(e) => setForm({ ...form, saas_address: e.target.value })}
                                placeholder="DIRECCIÓN_FÍSICA_ROOT"
                                className="bg-slate-50 border-slate-100 rounded-lg h-14 focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all font-bold text-slate-900"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="saas_email" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Email de notificaciones</Label>
                            <Input
                                id="saas_email"
                                value={form.saas_email}
                                onChange={(e) => setForm({ ...form, saas_email: e.target.value })}
                                placeholder="soporte@core.com"
                                className="bg-slate-50 border-slate-100 rounded-lg h-14 focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all font-bold text-slate-900"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="saas_phone" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Teléfono de contacto</Label>
                            <Input
                                id="saas_phone"
                                value={form.saas_phone}
                                onChange={(e) => setForm({ ...form, saas_phone: e.target.value })}
                                placeholder="+34 000 000 000"
                                className="bg-slate-50 border-slate-100 rounded-lg h-14 focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all font-bold text-slate-900"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="saas_website" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Sitio Web Plataforma</Label>
                            <Input
                                id="saas_website"
                                value={form.saas_website}
                                onChange={(e) => setForm({ ...form, saas_website: e.target.value })}
                                placeholder="https://www.tuplataforma.com"
                                className="bg-slate-50 border-slate-100 rounded-lg h-14 focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all font-bold text-slate-900"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Branding del Sistema - White Surface Card */}
            <div className="bg-white rounded-lg border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden group">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-[#3b60c1]">
                            <Palette size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Interfaz Visual Global</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configuración estética y despliegue de identidad</p>
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-12">
                    <div className="space-y-3 max-w-lg">
                        <Label htmlFor="app_name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Nombre de la Plataforma</Label>
                        <Input
                            id="app_name"
                            value={form.app_name}
                            onChange={(e) => setForm({ ...form, app_name: e.target.value })}
                            className="bg-white border-slate-100 border-b-4 border-b-[#3b60c1] rounded-lg h-16 focus:ring-4 focus:ring-blue-100/50 transition-all text-2xl font-black text-slate-900"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Layout size={14} className="text-slate-400" />
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logo Plataforma</Label>
                            </div>
                            <ImageUpload
                                label="Logo Web (Sidebar)"
                                value={form.saas_logo_web}
                                onChange={(url) => setForm({ ...form, saas_logo_web: url })}
                                path="saas/branding"
                            />
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Smartphone size={14} className="text-slate-400" />
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logo plataforma movil</Label>
                            </div>
                            <ImageUpload
                                label="Logo App (Móvil)"
                                value={form.saas_logo_app}
                                onChange={(url) => setForm({ ...form, saas_logo_app: url })}
                                path="saas/branding"
                            />
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles size={14} className="text-slate-400" />
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Favicon</Label>
                            </div>
                            <ImageUpload
                                label="Favicon"
                                value={form.saas_favicon}
                                onChange={(url) => setForm({ ...form, saas_favicon: url })}
                                path="saas/branding"
                            />
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Globe size={14} className="text-slate-400" />
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logo PDF / Marca Agua</Label>
                            </div>
                            <ImageUpload
                                label="Logo PDF"
                                value={form.saas_logo_pdf}
                                onChange={(url) => setForm({ ...form, saas_logo_pdf: url })}
                                path="saas/branding"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Configuración de Notificaciones - Floating Card */}
            <div className="bg-white rounded-lg border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden group">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-center text-rose-500">
                            <Mail size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Protocolos de Comunicación</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Filtros de facturación y alertas críticas</p>
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-8">
                    <div className="grid gap-4 max-w-lg">
                        <Label htmlFor="billing_email" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Email de reportes de la plataforma</Label>
                        <Input
                            id="billing_email"
                            type="email"
                            value={form.billing_email}
                            onChange={(e) => setForm({ ...form, billing_email: e.target.value })}
                            placeholder="billing@tuinstancia.com"
                            className="bg-slate-50 border-slate-100 rounded-lg h-14 focus:ring-4 focus:ring-rose-100/50 focus:border-rose-500 transition-all font-bold text-slate-900"
                        />
                        <div className="flex items-center gap-2 mt-2">
                            <Sparkles size={12} className="text-rose-400" />
                            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest leading-none">* Destino automático para reportes financieros del sistema.</p>
                        </div>
                    </div>
                </div>

                <div className="p-10 border-t border-slate-50 bg-white space-y-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                            <Scale size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase">Cláusula Legal en Correos</h3>
                            <p className="text-[10px] text-slate-400">Texto LOPD anclado al pie de página de los mensajes</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Textarea
                            id="saas_legal_text"
                            value={form.saas_legal_text}
                            onChange={(e) => setForm({ ...form, saas_legal_text: e.target.value })}
                            placeholder={"Ej: Le informamos que sus datos serán tratados por EMPRESA SL..."}
                            className="bg-slate-50 border-slate-100 rounded-lg min-h-[120px] focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all text-xs text-slate-600 leading-relaxed font-mono"
                        />
                    </div>
                </div>

                <div className="p-10 border-t border-slate-50 bg-slate-50/20 flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-[#3b60c1] hover:bg-[#2d4a94] text-white rounded-lg h-16 px-16 text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-blue-200/40 active:scale-95 flex gap-4"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save size={18} />}
                        {loading ? 'SINCRONIZANDO...' : 'GUARDAR'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

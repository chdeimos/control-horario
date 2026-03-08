'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateBulkSettings } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Code, Save, Mail, Loader2, Send, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface EmailsTabProps {
    settings: any
}

const EMAIL_TYPES = [
    { id: 'invite', name: 'Invitación a Usuarios', defaultHtml: '<p>Hola,</p><p>Has sido invitado a unirte a la plataforma...</p>' },
    { id: 'confirmation', name: 'Confirmación de Correo', defaultHtml: '<p>Hola,</p><p>Haz clic en el enlace para confirmar tu correo...</p>' },
    { id: 'recovery', name: 'Recuperación de Contraseña', defaultHtml: '<p>Hola,</p><p>Usa este link para restablecer tu contraseña...</p>' },
    { id: 'magic_link', name: 'Enlace Mágico (Acceso sin Clave)', defaultHtml: '<p>Hola,</p><p>Haz clic para entrar automáticamente...</p>' },
    { id: 'email_change', name: 'Cambio de Correo', defaultHtml: '<p>Hola,</p><p>Confirma el cambio a tu nueva dirección de correo...</p>' }
]

export function EmailsTab({ settings }: EmailsTabProps) {
    const [selectedType, setSelectedType] = useState('invite')
    const [htmlContent, setHtmlContent] = useState(settings[`email_template_${selectedType}`] || '')
    const [testEmail, setTestEmail] = useState('')

    const [isSaving, setIsSaving] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleTypeChange = (val: string) => {
        setSelectedType(val)
        setHtmlContent(settings[`email_template_${val}`] || '')
        setMessage(null)
    }

    const handleSave = async () => {
        setIsSaving(true)
        setMessage(null)
        try {
            const key = `email_template_${selectedType}`
            const res = await updateBulkSettings({ [key]: htmlContent })
            if (res.error) {
                setMessage({ type: 'error', text: res.error })
            } else {
                setMessage({ type: 'success', text: 'Plantilla de correo guardada con éxito.' })
                // Update local settings map implicitly if needed, but it should remount on standard save.
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Ocurrió un error inesperado al guardar la plantilla.' })
        } finally {
            setIsSaving(false)
        }
    }

    const handleTestEmail = async () => {
        if (!testEmail) {
            setMessage({ type: 'error', text: 'Introduce una dirección de correo para la prueba' })
            return
        }

        setIsTesting(true)
        setMessage(null)
        try {
            const res = await fetch('/api/admin/mail-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: selectedType, testEmail })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Server error')

            setMessage({ type: 'success', text: data.message || `Previsualización enviada a ${testEmail}` })
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Error de red enviando correo SMTP' })
        } finally {
            setIsTesting(false)
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {/* Left Panel: Selector and Preview */}
            <div className="md:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
                            <Mail size={16} />
                            Plantillas del Sistema
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Selecciona el tipo de correo que deseas editar. El pie legal y el encabezado se anexan automáticamente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tipo de Comunicación</Label>
                            <Select value={selectedType} onValueChange={handleTypeChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione plantilla" />
                                </SelectTrigger>
                                <SelectContent>
                                    {EMAIL_TYPES.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#0f172a] text-slate-300 border-none shadow-xl">
                    <CardHeader className="pb-3 border-b border-white/10">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-100 flex items-center gap-2">
                            <Send size={16} className="text-blue-400" />
                            Verificación SMTP
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-[11px] leading-relaxed">
                            Envía esta plantilla exacta a tu correo para comprobar el formato final, la visualización del logotipo y el pie legal.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-slate-200">Email de Destino (Prueba)</Label>
                            <Input
                                type="email"
                                placeholder="tunombre@empresa.com"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-blue-500"
                            />
                        </div>
                        <Button
                            variant="default"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase cursor-pointer"
                            onClick={handleTestEmail}
                            disabled={isTesting}
                        >
                            {isTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                            Enviar Previsualización REAL
                        </Button>
                    </CardContent>
                </Card>

                {message && (
                    <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : ''}>
                        {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                        <AlertTitle className="text-xs font-black uppercase">{message.type === 'error' ? 'Error' : 'Operación Exitosa'}</AlertTitle>
                        <AlertDescription className="text-xs font-medium">{message.text}</AlertDescription>
                    </Alert>
                )}
            </div>

            {/* Right Panel: Code Editor */}
            <div className="md:col-span-2 space-y-6">
                <Card className="flex flex-col h-full border-blue-100 shadow-xl shadow-blue-50">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-2">
                                    <Code size={16} />
                                    Cuerpo del Mensaje HTML
                                </CardTitle>
                                <CardDescription className="text-xs mt-1">
                                    Sintaxis soportada: Go Template (Ej. {'{{ .ConfirmationURL }}'}, {'{{ .Token }}'}).
                                </CardDescription>
                            </div>
                            <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wider">
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Guardar {EMAIL_TYPES.find(t => t.id === selectedType)?.name}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 relative min-h-[400px]">
                        <div className="absolute top-0 left-0 w-8 h-full bg-slate-100 border-r border-slate-200 z-10 flex flex-col pt-4 items-center text-[10px] font-mono text-slate-400 cursor-not-allowed">
                            {Array.from({ length: 20 }).map((_, i) => <div key={i} className="mb-4">{i + 1}</div>)}
                        </div>
                        <Textarea
                            value={htmlContent}
                            onChange={(e) => setHtmlContent(e.target.value)}
                            className="w-full h-full min-h-[500px] border-0 rounded-none focus-visible:ring-0 resize-y p-6 pl-12 font-mono text-sm leading-relaxed text-slate-700 bg-white"
                            placeholder={EMAIL_TYPES.find(t => t.id === selectedType)?.defaultHtml}
                            spellCheck={false}
                        />
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t border-slate-100 py-3 px-6 flex justify-between text-[11px] text-slate-500 font-medium">
                        <span>Formato soportado: HTML5 Inline CSS</span>
                        <span>Caracteres: {htmlContent.length}</span>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

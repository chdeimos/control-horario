'use client'

import { useState, useRef, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateBulkSettings } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Save, Mail, Loader2, Send, AlertCircle, CheckCircle2, Link as LinkIcon, Hash, AtSign } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { defaultTemplates } from '@/lib/email-templates'
import dynamic from 'next/dynamic'

// Quill editor needs next/dynamic to avoid window object errors on SSR
const ReactQuill = dynamic(async () => {
    const { default: RQ } = await import("react-quill-new")
    // eslint-disable-next-line react/display-name
    return ({ forwardedRef, ...props }: any) => <RQ ref={forwardedRef} {...props} />
}, { ssr: false })
import 'react-quill-new/dist/quill.snow.css'

interface EmailsTabProps {
    settings: any
}

const EMAIL_TYPES = [
    { id: 'invite', name: 'Invitación a Usuarios', defaultHtml: defaultTemplates.invite.content.trim() },
    { id: 'confirmation', name: 'Confirmación de Correo', defaultHtml: defaultTemplates.confirmation.content.trim() },
    { id: 'recovery', name: 'Recuperación de Contraseña', defaultHtml: defaultTemplates.recovery.content.trim() },
    { id: 'magic_link', name: 'Enlace Mágico (Acceso sin Clave)', defaultHtml: defaultTemplates.magic_link.content.trim() },
    { id: 'email_change', name: 'Cambio de Correo', defaultHtml: defaultTemplates.email_change.content.trim() }
]

export function EmailsTab({ settings }: EmailsTabProps) {
    const editorRef = useRef<any>(null)
    const [selectedType, setSelectedType] = useState('invite')

    // Obtener contenido inicial (El guardado o el maquetado perfecto por defecto)
    const getInitialContent = (type: string) => {
        return settings[`email_template_${type}`] || EMAIL_TYPES.find(t => t.id === type)?.defaultHtml || ''
    }

    const [htmlContent, setHtmlContent] = useState(getInitialContent(selectedType))
    const [testEmail, setTestEmail] = useState('')

    const [isSaving, setIsSaving] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleTypeChange = (val: string) => {
        setSelectedType(val)
        setHtmlContent(getInitialContent(val))
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

    const insertVariable = (variable: string) => {
        if (editorRef.current) {
            const editor = editorRef.current.getEditor();
            // Evitar pérdida de foco y forzar la inserción en el editor virtual
            editor.focus();
            const range = editor.getSelection(true) || { index: 0 };
            editor.insertText(range.index, variable);
            editor.setSelection(range.index + variable.length);
        } else {
            setHtmlContent(htmlContent + variable);
        }
    }

    // Configuración barra WYSIWYG de Quill
    const modules = useMemo(() => ({
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
        ]
    }), [])

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
                                    Editor Interactivo (WYSIWYG)
                                </CardTitle>
                                <CardDescription className="text-xs mt-1">
                                    Formatea tu texto libremente. Las variables clave de GoTrue se insertarán dinámicamente.
                                </CardDescription>
                            </div>
                            <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wider shadow-md">
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Guardar {EMAIL_TYPES.find(t => t.id === selectedType)?.name}
                            </Button>
                        </div>

                        {/* TOOLBAR HTML / VARIABLES CUSTOM */}
                        <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                            <Button variant="default" size="sm" className="h-7 text-[10px] font-bold gap-1 bg-gradient-to-tr from-blue-700 to-blue-500 text-white shadow-sm border-0" onClick={() => insertVariable('{{ .ConfirmationURL }}')} title="El enlace de la acción principal del correo.">
                                <LinkIcon size={12} /> URL Acción Oculta
                            </Button>
                            <Button variant="default" size="sm" className="h-7 text-[10px] font-bold gap-1 bg-gradient-to-tr from-blue-700 to-blue-500 text-white shadow-sm border-0" onClick={() => insertVariable('{{ .Token }}')} title="El código numérico de 6 dígitos asociado.">
                                <Hash size={12} /> PIN Secreto (OTP)
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold gap-1 bg-white text-slate-700 border-slate-200 shadow-sm" onClick={() => insertVariable('{{ .Email }}')} title="Correo del destinatario.">
                                <AtSign size={12} /> Email de Destino
                            </Button>

                            <span className="w-px h-5 bg-slate-300 mx-2 self-center"></span>
                            <span className="text-[10px] text-slate-400 self-center font-bold tracking-widest uppercase">Inyección Rápida de Supabase</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 relative min-h-[400px] border-none">
                        <style>
                            {`
                                .ql-container {
                                    font-size: 15px !important;
                                    min-height: 400px !important;
                                    border-bottom-left-radius: 0.5rem;
                                    border-bottom-right-radius: 0.5rem;
                                    border: none !important;
                                }
                                .ql-toolbar {
                                    border: none !important;
                                    border-bottom: 1px solid #e2e8f0 !important;
                                    background: #f8fafc;
                                    padding: 12px 16px !important;
                                }
                                .ql-editor {
                                    min-height: 400px;
                                }
                            `}
                        </style>
                        <ReactQuill
                            forwardedRef={editorRef}
                            theme="snow"
                            value={htmlContent}
                            onChange={setHtmlContent}
                            modules={modules}
                            className="w-full bg-white h-full pb-10"
                            placeholder="Empieza a escribir tu correo corporativo aquí..."
                        />
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t border-slate-100 py-3 px-6 flex justify-between text-[11px] text-slate-500 font-medium z-10">
                        <span>Formato: HTML Enriquecido (WYSIWYG)</span>
                        <span>Pie Legal Adjunto Automáticamente al enviar</span>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

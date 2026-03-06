'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Database, Download, Upload, AlertTriangle, CheckCircle2, Loader2, HardDrive, ShieldAlert, FileJson, Sparkles } from 'lucide-react'
import { createBackup, restoreBackup } from './actions'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'

export function BackupTab() {
    const [loading, setLoading] = useState(false)
    const [restoring, setRestoring] = useState(false)

    async function handleDownloadBackup() {
        setLoading(true)
        try {
            const backup = await createBackup()
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `backup-control-horario-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            toast.success('Copia de seguridad generada y descargada')
        } catch (error: any) {
            toast.error(`Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        // Ideally replace window.confirm with a custom AlertDialog, but keeping logic for now
        if (!confirm('¿ESTÁS SEGURO? Esta operación borrará los datos actuales y restaurará los del archivo. Esta acción no se puede deshacer.')) {
            e.target.value = ''
            return
        }

        setRestoring(true)
        try {
            const reader = new FileReader()
            reader.onload = async (event) => {
                const content = event.target?.result
                if (typeof content !== 'string') return

                const backupData = JSON.parse(content)
                const res = await restoreBackup(backupData)

                if (res.error) {
                    toast.error(`Error al restaurar: ${res.error}`)
                } else {
                    toast.success('Base de datos restaurada correctamente')
                    setTimeout(() => window.location.reload(), 2000)
                }
            }
            reader.readAsText(file)
        } catch (error: any) {
            toast.error(`Error crítico: ${error.message}`)
        } finally {
            setRestoring(false)
            e.target.value = ''
        }
    }

    return (
        <div className="max-w-4xl space-y-12 pb-20">
            {/* copias de seguridad - White Card */}
            <div className="bg-white rounded-lg border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden group">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-[#3b60c1]">
                            <Database size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">copias de seguridad</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">gestion de copias de seguridad y restauracion</p>
                        </div>
                    </div>
                    <HardDrive className="hidden md:block h-6 w-6 text-slate-200" />
                </div>

                <div className="p-10 space-y-12">
                    <div className="grid gap-10 md:grid-cols-2">
                        {/* Exportar */}
                        <div className="p-8 bg-blue-50/30 border border-blue-100/50 rounded-lg relative flex flex-col justify-between group/box transition-all hover:bg-blue-50 hover:shadow-xl hover:shadow-blue-200/20">
                            <div className="space-y-4 mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-[#3b60c1] rounded-full animate-pulse"></div>
                                    <h4 className="text-[11px] font-black text-[#3b60c1] uppercase tracking-[0.2em]">Copia de Seguridad DB</h4>
                                </div>
                                <p className="text-[12px] text-slate-500 font-bold uppercase leading-relaxed tracking-tight">
                                    Compilar estado actual de la plataforma en un paquete JSON portable. Incluye sedes, logs y perfiles globales.
                                </p>
                            </div>
                            <Button
                                onClick={handleDownloadBackup}
                                disabled={loading || restoring}
                                className="w-full h-14 bg-[#3b60c1] hover:bg-[#2d4a94] text-white font-black uppercase tracking-[0.2em] rounded-lg transition-all flex gap-3 shadow-lg shadow-blue-200/40 active:scale-95"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download size={18} />}
                                Generar Copia de Seguridad
                            </Button>
                        </div>

                        {/* Importar */}
                        <div className="p-8 bg-amber-50/30 border border-amber-100/50 rounded-lg relative flex flex-col justify-between group/box transition-all hover:bg-amber-50 hover:shadow-xl hover:shadow-amber-200/20">
                            <div className="space-y-4 mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                    <h4 className="text-[11px] font-black text-amber-600 uppercase tracking-[0.2em]">Restaurar copia de Seguridad DB</h4>
                                </div>
                                <p className="text-[12px] text-slate-500 font-bold uppercase leading-relaxed tracking-tight">
                                    sube una copia de seguridad y restaura la plataforma.
                                </p>
                            </div>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileSelect}
                                    disabled={loading || restoring}
                                    className="opacity-0 absolute inset-0 cursor-pointer z-10 w-full h-full"
                                />
                                <Button
                                    variant="outline"
                                    disabled={loading || restoring}
                                    className="w-full h-14 border-amber-200 text-amber-600 hover:bg-amber-100/50 font-black uppercase tracking-[0.2em] rounded-lg transition-all flex gap-3 active:scale-95"
                                >
                                    {restoring ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload size={18} />}
                                    Subir Copia
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-rose-50 border border-rose-100 rounded-lg relative overflow-hidden group/warning">
                        <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 transition-transform group-hover/warning:rotate-12">
                            <ShieldAlert size={60} className="text-rose-500" />
                        </div>
                        <div className="flex gap-6 relative z-10">
                            <AlertTriangle className="h-8 w-8 text-rose-500 shrink-0" />
                            <div className="space-y-3">
                                <h4 className="text-[12px] font-black text-rose-600 uppercase tracking-[0.3em]">ALERTA DE SEGURIDAD CRÍTICA</h4>
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed max-w-2xl opacity-70">
                                    La restauración es una operación destructiva que purga la base de datos actual.
                                    No se garantiza la integridad de la capa de autenticación si los identificadores de usuario del snapshot no coinciden con el proveedor de identidad actual.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    )
}

function AuditItem({ label, icon }: { label: string, icon: React.ReactNode }) {
    return (
        <div className="flex items-center gap-4 p-6 bg-white border border-slate-100 rounded-2xl group hover:border-[#3b60c1]/30 transition-all shadow-xl shadow-slate-200/50 hover:-translate-y-1">
            <div className="text-slate-300 group-hover:text-[#3b60c1] transition-colors">
                {icon}
            </div>
            <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-900 uppercase tracking-widest transition-colors">{label}</span>
        </div>
    )
}

function ShieldCheck({ size = 16, className = "" }) {
    return <CheckCircle2 size={size} className={className} />
}

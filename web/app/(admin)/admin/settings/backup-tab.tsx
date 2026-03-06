'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Download, Upload, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { createBackup, restoreBackup } from './actions'
import { toast } from 'sonner'

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
        <div className="max-w-4xl space-y-6">
            <Card className="border-slate-200">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-blue-600" />
                        <CardTitle>Gestión de Copias de Seguridad</CardTitle>
                    </div>
                    <CardDescription>
                        Descarga una copia completa de la base de datos o restaura una versión anterior.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Exportar */}
                        <div className="p-4 border rounded-lg bg-green-50/30 border-green-100 flex flex-col justify-between">
                            <div className="space-y-2 mb-4">
                                <h3 className="font-semibold flex items-center gap-2 text-green-700">
                                    <Download className="h-4 w-4" />
                                    Exportar Datos
                                </h3>
                                <p className="text-sm text-slate-600">
                                    Genera un archivo JSON con toda la información de la empresa, empleados, fichajes y configuraciones.
                                </p>
                            </div>
                            <Button
                                onClick={handleDownloadBackup}
                                disabled={loading || restoring}
                                className="w-full bg-green-600 hover:bg-green-700"
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                Descargar JSON
                            </Button>
                        </div>

                        {/* Importar */}
                        <div className="p-4 border rounded-lg bg-amber-50/30 border-amber-100 flex flex-col justify-between">
                            <div className="space-y-2 mb-4">
                                <h3 className="font-semibold flex items-center gap-2 text-amber-700">
                                    <Upload className="h-4 w-4" />
                                    Restaurar Backup
                                </h3>
                                <p className="text-sm text-slate-600">
                                    Sube un archivo de copia de seguridad anterior para recuperar el estado del sistema.
                                </p>
                            </div>
                            <div className="relative">
                                <Input
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileSelect}
                                    disabled={loading || restoring}
                                    className="opacity-0 absolute inset-0 cursor-pointer z-10"
                                />
                                <Button
                                    variant="outline"
                                    disabled={loading || restoring}
                                    className="w-full border-amber-200 text-amber-700 hover:bg-amber-100/50"
                                >
                                    {restoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    Seleccionar Archivo
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-slate-800">Nota de seguridad</h4>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    La restauración es una operación destructiva que sobrescribe la base de datos actual.
                                    Se recomienda generar una copia de seguridad antes de proceder con cualquier restauración.
                                    Esta herramienta respalda datos de negocio (fichajes, empleados, etc.), pero no gestiona
                                    la creación de usuarios en la capa de autenticación si el archivo contiene IDs que no existen en el sistema actual.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-white shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-xs font-medium">Formato JSON portable</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-white shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-xs font-medium">Integridad referencial</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-white shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-xs font-medium">Backup de configuraciones</span>
                </div>
            </div>
        </div>
    )
}

function Input({ ...props }) {
    return (
        <input
            {...props}
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${props.className}`}
        />
    )
}

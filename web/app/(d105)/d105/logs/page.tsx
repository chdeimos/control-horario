'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getAccessLogs, getAdminAccessLogs, getCronLogs, getEmailLogs } from './actions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
    ShieldAlert,
    Mail,
    Clock,
    Unlock,
    AlertCircle,
    CheckCircle2,
    Globe,
    Monitor,
    Key,
    Server,
    Search
} from 'lucide-react'
import { Input } from "@/components/ui/input"

export default function LogsPage() {
    const [accessLogs, setAccessLogs] = useState<any[]>([])
    const [adminLogs, setAdminLogs] = useState<any[]>([])
    const [cronLogs, setCronLogs] = useState<any[]>([])
    const [emailLogs, setEmailLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        async function load() {
            try {
                const [acc, adm, crn, eml] = await Promise.all([
                    getAccessLogs(),
                    getAdminAccessLogs(),
                    getCronLogs(),
                    getEmailLogs()
                ])
                setAccessLogs(acc)
                setAdminLogs(adm)
                setCronLogs(crn)
                setEmailLogs(eml)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const filterLogs = (logs: any[], fields: string[]) => {
        if (!search) return logs
        return logs.filter(log =>
            fields.some(field =>
                String(log[field] || '').toLowerCase().includes(search.toLowerCase())
            )
        )
    }

    if (loading) return (
        <div className="flex h-[400px] items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b60c1]"></div>
        </div>
    )

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Centro de Monitoreo</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Auditoría global y estados del sistema en tiempo real</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar en logs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-11 bg-white border-slate-100 rounded-lg shadow-sm font-bold text-xs"
                    />
                </div>
            </div>

            <Tabs defaultValue="access" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-slate-100 rounded-xl mb-6">
                    <TabsTrigger value="access" className="rounded-lg py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <div className="flex items-center gap-2">
                            <Unlock size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Accesos Gen.</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="admin" className="rounded-lg py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <div className="flex items-center gap-2">
                            <ShieldAlert size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Superadmin</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="cron" className="rounded-lg py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Tareas Cron</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="email" className="rounded-lg py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <div className="flex items-center gap-2">
                            <Mail size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Comunicaciones</span>
                        </div>
                    </TabsTrigger>
                </TabsList>

                {/* 1. ACCESOS GENERALES */}
                <TabsContent value="access">
                    <Card className="border-slate-100 shadow-xl shadow-slate-200/40">
                        <ScrollArea className="h-[600px]">
                            <div className="p-0">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
                                        <tr>
                                            <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest pl-6">Fecha / Hora</th>
                                            <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest">Usuario / Email</th>
                                            <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest">Resultado</th>
                                            <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest">Origen</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {filterLogs(accessLogs, ['email', 'error_message', 'ip_address']).map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="p-4 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${log.success ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                                            <Unlock size={14} />
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-black text-slate-900 block uppercase">
                                                                {format(new Date(log.created_at), 'dd MMM yyyy', { locale: es })}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-mono">
                                                                {format(new Date(log.created_at), 'HH:mm:ss')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-slate-700">{log.email || 'Anónimo'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {log.success ? (
                                                        <Badge className="bg-emerald-500 text-white border-none shadow-lg shadow-emerald-200 text-[8px] font-black uppercase tracking-widest px-3 py-1">LOGIN CORRECTO</Badge>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            <Badge className="bg-rose-500 text-white border-none shadow-lg shadow-rose-200 text-[8px] font-black uppercase tracking-widest px-3 py-1">ERROR DE LOGIN</Badge>
                                                            <p className="text-[9px] text-rose-400 font-bold max-w-[200px] truncate">
                                                                {log.error_message === 'Invalid login credentials' ? 'Datos de login incorrectos.' : log.error_message}
                                                            </p>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right pr-6">
                                                    <div className="inline-flex flex-col items-end">
                                                        <div className="flex items-center gap-1.5">
                                                            <Globe size={10} className="text-slate-400" />
                                                            <span className="text-[10px] font-mono font-bold text-slate-900">{log.ip_address}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Monitor size={10} className="text-slate-400" />
                                                            <span className="text-[8px] text-slate-400 uppercase font-bold truncate max-w-[150px]">{log.user_agent}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </ScrollArea>
                    </Card>
                </TabsContent>

                {/* 2. ACCESOS SUPERADMIN */}
                <TabsContent value="admin">
                    <Card className="border-slate-100 shadow-xl shadow-slate-200/40">
                        <ScrollArea className="h-[600px]">
                            <div className="p-0">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
                                        <tr>
                                            <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest pl-6">Registro Auditoría</th>
                                            <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest">Identidad / Key</th>
                                            <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest">Resultado</th>
                                            <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest">Ubicación / Datos</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {filterLogs(adminLogs, ['username', 'password_attempted', 'ip_address']).map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${log.success ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                                            <Key size={14} />
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-black text-slate-900 block uppercase">
                                                                {format(new Date(log.created_at), 'dd/MM/yyyy')}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-mono">
                                                                {format(new Date(log.created_at), 'HH:mm:ss')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-black text-[#3b60c1] uppercase tracking-tighter">{log.username}</span>
                                                        {!log.success && (
                                                            <div className="flex items-center gap-1.5 opacity-60">
                                                                <AlertCircle size={10} className="text-rose-500" />
                                                                <span className="text-[9px] font-mono text-slate-400 line-through">pw: {log.password_attempted || '***'}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {log.success ? (
                                                        <Badge className="bg-emerald-500 text-white border-none shadow-lg shadow-emerald-200 text-[8px] font-black uppercase tracking-widest px-3 py-1">LOGIN CORRECTO</Badge>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            <Badge className="bg-rose-500 text-white border-none shadow-lg shadow-rose-200 text-[8px] font-black uppercase tracking-widest px-3 py-1">ERROR DE LOGIN</Badge>
                                                            <p className="text-[9px] text-rose-400 font-bold max-w-[200px] truncate">
                                                                {log.error_message === 'Invalid login credentials' ? 'Datos de login incorrectos.' : log.error_message}
                                                            </p>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right pr-6">
                                                    <div className="inline-flex flex-col items-end">
                                                        <span className="text-[10px] font-black text-slate-900 font-mono tracking-wider">{log.ip_address}</span>
                                                        <span className="text-[8px] text-slate-400 max-w-[200px] truncate uppercase font-bold">{log.user_agent}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </ScrollArea>
                    </Card>
                </TabsContent>

                {/* 3. TAREAS CRON */}
                <TabsContent value="cron">
                    <Card className="border-slate-100 shadow-xl shadow-slate-200/40">
                        <ScrollArea className="h-[600px]">
                            <div className="p-0">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
                                        <tr>
                                            <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest pl-6">Script / Proceso</th>
                                            <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest">Estado</th>
                                            <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest">Resumen Ejecución</th>
                                            <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest text-right pr-6">Rendimiento</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {filterLogs(cronLogs, ['cron_name', 'result_summary', 'error_detail']).map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="p-4 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${log.status === 'success' ? 'bg-orange-50 text-orange-500' : 'bg-rose-50 text-rose-500'}`}>
                                                            <Server size={14} />
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-black text-slate-900 block uppercase tracking-tighter">{log.cron_name}</span>
                                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Ejecutado: {format(new Date(log.created_at), 'HH:mm (dd/MM)')}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {log.status === 'success' ? (
                                                        <Badge className="bg-emerald-500 text-white border-none shadow-lg shadow-emerald-200 text-[8px] font-black uppercase tracking-widest px-3 py-1">SUCCESS</Badge>
                                                    ) : (
                                                        <Badge className="bg-rose-500 text-white border-none shadow-lg shadow-rose-200 text-[8px] font-black uppercase tracking-widest px-3 py-1">CRON_ERROR</Badge>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="max-w-[300px]">
                                                        <p className="text-xs font-bold text-slate-600 truncate">{log.result_summary || '-'}</p>
                                                        {log.error_detail && <p className="text-[9px] text-rose-500 mt-1 font-mono">{log.error_detail}</p>}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right pr-6">
                                                    <Badge variant="outline" className="text-[10px] font-mono border-slate-100 text-slate-400 font-bold tracking-tighter bg-slate-50 px-2 py-1">
                                                        {log.duration_ms}ms
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </ScrollArea>
                    </Card>
                </TabsContent>

                {/* 4. COMUNICACIONES */}
                <TabsContent value="email">
                    <Card className="border-slate-100 shadow-xl shadow-slate-200/40">
                        <ScrollArea className="h-[600px]">
                            <div className="p-0">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
                                        <tr>
                                            <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest pl-6">Destinatario / Asunto</th>
                                            <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest">Plantilla</th>
                                            <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest">Estado Envío</th>
                                            <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest text-right pr-6">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {filterLogs(emailLogs, ['recipient', 'subject', 'error_message']).map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="p-4 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${log.status === 'sent' ? 'bg-blue-50 text-blue-500' : 'bg-rose-50 text-rose-500'}`}>
                                                            <Mail size={14} />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <span className="text-xs font-black text-slate-900 block truncate max-w-[200px]">{log.recipient}</span>
                                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight truncate max-w-[250px]">{log.subject}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200 text-slate-400 py-0 h-5 bg-slate-50">
                                                        {log.template_name || 'GENERIC'}
                                                    </Badge>
                                                </td>
                                                <td className="p-4">
                                                    {log.status === 'sent' ? (
                                                        <Badge className="bg-emerald-500 text-white border-none shadow-lg shadow-emerald-200 text-[8px] font-black uppercase tracking-widest px-3 py-1">DELIVERED</Badge>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            <Badge className="bg-rose-500 text-white border-none shadow-lg shadow-rose-200 text-[8px] font-black uppercase tracking-widest px-3 py-1">FAILED</Badge>
                                                            <p className="text-[8px] text-rose-400 font-bold line-clamp-1">{log.error_message}</p>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right pr-6">
                                                    <span className="text-[10px] text-slate-400 font-mono tracking-tight font-bold uppercase">
                                                        {format(new Date(log.created_at), 'dd/MM HH:mm:ss')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </ScrollArea>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

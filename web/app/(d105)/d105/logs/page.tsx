'use client'

import { useEffect, useState } from 'react'
import { Card } from "@/components/ui/card"
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
    Search,
    History
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

    const StatusBadge = ({ success, message }: { success: boolean, message?: string }) => {
        if (success) {
            return (
                <Badge className="bg-emerald-500 text-white border-none shadow-lg shadow-emerald-200 text-[8px] font-black uppercase tracking-widest px-3 py-1">
                    LOGIN CORRECTO
                </Badge>
            )
        }

        const label = message === 'Invalid login credentials' ? 'Datos de login incorrectos.' : 'ERROR DE LOGIN'

        return (
            <div className="space-y-1">
                <Badge className="bg-rose-500 text-white border-none shadow-lg shadow-rose-200 text-[8px] font-black uppercase tracking-widest px-3 py-1">
                    {label === 'Datos de login incorrectos.' ? 'ERROR DE LOGIN' : label}
                </Badge>
                <p className="text-[9px] text-rose-400 font-bold max-w-[200px] truncate uppercase">
                    {label === 'Datos de login incorrectos.' ? label : message}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200">
                        <History size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Auditoría de Sistema</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Registros de seguridad y operaciones d105</p>
                    </div>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar en el historial..."
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
                            <span className="text-[10px] font-black uppercase tracking-wider">Emails</span>
                        </div>
                    </TabsTrigger>
                </TabsList>

                {/* TABLAS UNIFICADAS */}
                {[
                    { id: 'access', logs: accessLogs, icon: Unlock, title: 'Acceso Plataforma' },
                    { id: 'admin', logs: adminLogs, icon: Key, title: 'Auditoría Admin' },
                ].map((tab) => (
                    <TabsContent key={tab.id} value={tab.id}>
                        <Card className="border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                            <ScrollArea className="h-[600px]">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
                                        <tr>
                                            <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest pl-8">Timestamp</th>
                                            <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest">Identificador</th>
                                            <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest text-center">Resultado</th>
                                            <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest text-right pr-8">Información Técnica</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {filterLogs(tab.logs, ['email', 'username', 'error_message', 'ip_address']).map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="p-4 pl-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.success ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                                            <tab.icon size={16} />
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-black text-slate-900 block uppercase">
                                                                {format(new Date(log.created_at), 'dd MMM yyyy', { locale: es })}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-mono font-bold tracking-tight">
                                                                {format(new Date(log.created_at), 'HH:mm:ss')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-black text-[#3b60c1] uppercase">{log.email || log.username || 'Sistema'}</span>
                                                        {tab.id === 'admin' && !log.success && (
                                                            <p className="text-[8px] font-mono text-slate-400 bg-slate-50 rounded px-1.5 py-0.5 inline-block border border-slate-100">
                                                                Password: {log.password_attempted || '***'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <StatusBadge success={log.success} message={log.error_message} />
                                                </td>
                                                <td className="p-4 text-right pr-8">
                                                    <div className="inline-flex flex-col items-end gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <Globe size={12} className="text-slate-300" />
                                                            <span className="text-[10px] font-mono font-black text-slate-700">{log.ip_address}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Monitor size={12} className="text-slate-300" />
                                                            <span className="text-[8px] text-slate-400 uppercase font-black truncate max-w-[180px]">{log.user_agent}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </ScrollArea>
                        </Card>
                    </TabsContent>
                ))}

                {/* CRON TASKS */}
                <TabsContent value="cron">
                    <Card className="border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                        <ScrollArea className="h-[600px]">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
                                    <tr>
                                        <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest pl-8">Tarea / Script</th>
                                        <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest text-center">Estado</th>
                                        <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest">Resumen</th>
                                        <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest text-right pr-8">Performance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filterLogs(cronLogs, ['cron_name', 'result_summary']).map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-4 pl-8">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.status === 'success' ? 'bg-orange-50 text-orange-500' : 'bg-rose-50 text-rose-500'}`}>
                                                        <Server size={16} />
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-black text-slate-900 block uppercase tracking-tighter">{log.cron_name}</span>
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase">{format(new Date(log.created_at), 'dd/MM HH:mm')}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <Badge className={`border-none shadow-lg text-[8px] font-black uppercase tracking-widest px-3 py-1 ${log.status === 'success' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-rose-500 shadow-rose-200'
                                                    }`}>
                                                    {log.status === 'success' ? 'EJECUCIÓN OK' : 'CRON ERROR'}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-[11px] font-bold text-slate-600 line-clamp-2">{log.result_summary || '-'}</p>
                                                {log.error_detail && <p className="text-[9px] text-rose-500 mt-1 font-mono font-bold">{log.error_detail}</p>}
                                            </td>
                                            <td className="p-4 text-right pr-8">
                                                <Badge variant="outline" className="text-[10px] font-mono border-slate-100 text-slate-400 font-black bg-slate-50 px-2 py-1">
                                                    {log.duration_ms}ms
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </ScrollArea>
                    </Card>
                </TabsContent>

                {/* EMAILS */}
                <TabsContent value="email">
                    <Card className="border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                        <ScrollArea className="h-[600px]">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
                                    <tr>
                                        <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest pl-8">Email Enviado</th>
                                        <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest text-center">Resultado</th>
                                        <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest">Metadata</th>
                                        <th className="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest text-right pr-8">Registro</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filterLogs(emailLogs, ['recipient', 'subject']).map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-4 pl-8">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.status === 'sent' ? 'bg-blue-50 text-blue-500' : 'bg-rose-50 text-rose-500'}`}>
                                                        <Mail size={16} />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <span className="text-xs font-black text-slate-900 block truncate max-w-[200px]">{log.recipient}</span>
                                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight truncate max-w-[250px]">{log.subject}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <Badge className={`border-none shadow-lg text-[8px] font-black uppercase tracking-widest px-3 py-1 ${log.status === 'sent' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-rose-500 shadow-rose-200'
                                                    }`}>
                                                    {log.status === 'sent' ? 'LOGRADO' : 'FALLIDO'}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200 text-slate-400 py-0.5 px-2 bg-slate-50">
                                                    {log.template_name || 'GENERIC'}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right pr-8">
                                                <span className="text-[10px] text-slate-400 font-mono font-black uppercase">
                                                    {format(new Date(log.created_at), 'dd/MM HH:mm')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </ScrollArea>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

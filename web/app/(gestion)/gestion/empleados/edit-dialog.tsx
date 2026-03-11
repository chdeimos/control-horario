'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScheduleTab } from './schedule-tab'
import { updateEmployee, updateEmployeeSchedules, getEmployeeSchedules } from './actions'
import { z } from "zod"
import { User, CalendarClock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// DNI Validation Helper
// DNI/NIE/NIF Validation Helper (Spanish)
function isValidDNI(value: string): boolean {
    if (!value) return false

    // Clean string: remove spaces, dots, dashes and uppercase
    const dni = value.trim().replace(/[\s.-]/g, '').toUpperCase()

    // Basic regex for DNI (6-8 numbers + 1 letter) or NIE (1 letter + 7 numbers + 1 letter)
    const dniRegex = /^([0-9]{6,8}|[XYZ][0-9]{7})[TRWAGMYFPDXBNJZSQVHLCKE]$/
    if (!dniRegex.test(dni)) return false

    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE'
    let numberPart = dni.substring(0, dni.length - 1)
    const letterPart = dni.substring(dni.length - 1)

    // Handle NIE prefix conversion
    numberPart = numberPart
        .replace('X', '0')
        .replace('Y', '1')
        .replace('Z', '2')

    const number = parseInt(numberPart, 10)
    const expectedLetter = letters.charAt(number % 23)

    return expectedLetter === letterPart
}

const employeeSchema = z.object({
    full_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    nif: z.string().min(1, "El DNI/NIE es obligatorio").refine(isValidDNI, "DNI/NIE inválido (Formato 12345678A)"),
    email: z.string().email("Email inválido"),
    role: z.string(),
    department_id: z.string().optional(),
    pin_code: z.string().optional().refine(val => !val || /^\d{4}$/.test(val), "El PIN debe tener exactamente 4 dígitos"),
    total_vacation_days: z.coerce.number().min(0, "No puede ser negativo"),
    total_personal_days: z.coerce.number().min(0, "No puede ser negativo"),
    scheduled_hours: z.coerce.number().min(0).max(24),
    status: z.enum(["active", "terminated", "medical_leave", "unpaid_leave"]).optional(),
    schedule_type: z.string().optional()
})

type FieldErrors = Record<string, string>

function calculateTotalWeeklyHours(schedules: any[], type: string) {
    if (!schedules || schedules.length === 0) return 0

    let totalMinutes = 0

    schedules.forEach(s => {
        if (!s.is_active) return

        if (type === 'flexible') {
            totalMinutes += (s.target_total_hours || 8) * 60
        } else {
            let dayMinutes = 0
            if (s.start_time && s.end_time) {
                const start = s.start_time.split(':').map(Number)
                const end = s.end_time.split(':').map(Number)
                dayMinutes += (end[0] * 60 + end[1]) - (start[0] * 60 + start[1])
            }
            if (s.start_time_2 && s.end_time_2) {
                const start = s.start_time_2.split(':').map(Number)
                const end = s.end_time_2.split(':').map(Number)
                dayMinutes += (end[0] * 60 + end[1]) - (start[0] * 60 + start[1])
            }
            totalMinutes += dayMinutes
        }
    })

    return Math.round((totalMinutes / 60) * 10) / 10
}

export function EditEmployeeDialog({
    employee,
    departments,
    open,
    onOpenChange,
    settings
}: {
    employee: any,
    departments: any[],
    open: boolean,
    onOpenChange: (open: boolean) => void,
    settings?: any
}) {
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<FieldErrors>({})
    const [scheduleType, setScheduleType] = useState(employee.schedule_type || 'flexible')
    const [scheduledHours, setScheduledHours] = useState(employee.scheduled_hours ?? 8.0)
    const [schedules, setSchedules] = useState<any[]>([])
    const [schedulesLoading, setSchedulesLoading] = useState(true)

    useEffect(() => {
        if (open && employee.id) {
            setSchedulesLoading(true)
            getEmployeeSchedules(employee.id).then(res => {
                if (res.data) setSchedules(res.data)
                setSchedulesLoading(false)
            })
        }
    }, [open, employee.id])

    useEffect(() => {
        if (schedules.length > 0) {
            const total = calculateTotalWeeklyHours(schedules, scheduleType)
            if (total > 0) {
                setScheduledHours(total)
            }
        }
    }, [scheduleType, schedules])

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setErrors({})
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        formData.set('schedule_type', scheduleType) // Ensure current selection is sent

        const nifInput = String(formData.get('nif')).trim().replace(/[\s.-]/g, '').toUpperCase()
        formData.set('nif', nifInput)

        // For database storage, we save the daily average (total / active days)
        // to maintain compatibility with daily registry views
        const activeDaysCount = schedules.filter(s => s.is_active).length || 5
        const dailyAverage = Math.round((scheduledHours / activeDaysCount) * 10) / 10

        const data = {
            full_name: String(formData.get('full_name')),
            nif: nifInput,
            email: employee.email,
            role: String(formData.get('role')),
            department_id: String(formData.get('department_id')),
            pin_code: String(formData.get('pin_code')),
            total_vacation_days: formData.get('total_vacation_days'),
            total_personal_days: formData.get('total_personal_days'),
            scheduled_hours: dailyAverage,
            status: String(formData.get('status')),
            schedule_type: scheduleType
        }

        // Validate basic fields (nif is already cleaned)
        const result = employeeSchema.safeParse(data)

        if (!result.success) {
            const fieldErrors: FieldErrors = {}
            result.error.issues.forEach(issue => {
                if (issue.path[0]) {
                    fieldErrors[String(issue.path[0])] = issue.message
                }
            })
            setErrors(fieldErrors)
            setLoading(false)
            return
        }

        try {
            // 1. Update Core Profile
            const activeDaysCount = schedules.filter(s => s.is_active).length || 5
            const dailyAverage = Math.round((scheduledHours / activeDaysCount) * 10) / 10
            formData.set('scheduled_hours', dailyAverage.toString())

            const res = await updateEmployee(employee.id, formData)
            if (res.error) throw new Error(res.error)

            // 2. Update Schedules (only if type is fixed, but we sync anyway)
            const resSchedules = await updateEmployeeSchedules(employee.id, schedules, scheduleType)
            if (resSchedules.error) throw new Error(resSchedules.error)

            toast.success('Empleado y horario actualizados')
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-lg border-slate-200 shadow-2xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-1.5 h-6 bg-[#3b60c1] rounded-full"></div>
                            <DialogTitle className="text-2xl font-bold text-slate-900 tracking-tight text-left">Ficha de Empleado</DialogTitle>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-4">{employee.email}</p>
                    </DialogHeader>

                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="w-full justify-start rounded-none border-b border-slate-100 bg-white px-8 h-14 gap-8">
                            <TabsTrigger
                                value="general"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#3b60c1] rounded-none h-14 px-0 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 data-[state=active]:text-[#3b60c1] transition-all"
                            >
                                <User className="h-4 w-4 mr-2" strokeWidth={3} />
                                Datos Generales
                            </TabsTrigger>
                            <TabsTrigger
                                value="schedule"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#3b60c1] rounded-none h-14 px-0 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 data-[state=active]:text-[#3b60c1] transition-all"
                            >
                                <CalendarClock className="h-4 w-4 mr-2" strokeWidth={3} />
                                Horario Laboral
                            </TabsTrigger>
                        </TabsList>

                        <div className="p-8 max-h-[60vh] overflow-y-auto">
                            <TabsContent value="general" className="mt-0 space-y-6 hidden data-[state=active]:block" forceMount>
                                <div className="grid gap-2.5">
                                    <Label htmlFor="full_name" className={`text-[11px] font-bold uppercase tracking-widest ml-1 ${errors.full_name ? "text-rose-500" : "text-slate-500"}`}>Nombre Completo *</Label>
                                    <Input
                                        id="full_name" name="full_name"
                                        defaultValue={employee.full_name}
                                        className={`h-11 bg-slate-50 border-slate-100 rounded-lg text-sm font-semibold text-slate-700 ${errors.full_name ? "border-rose-500 ring-rose-500/20" : "focus:ring-[#3b60c1]/20"}`}
                                    />
                                    {errors.full_name && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">{errors.full_name}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="grid gap-2.5">
                                        <Label htmlFor="nif" className={`text-[11px] font-bold uppercase tracking-widest ml-1 ${errors.nif ? "text-rose-500" : "text-slate-500"}`}>NIF / DNI *</Label>
                                        <Input
                                            id="nif" name="nif"
                                            defaultValue={employee.nif || ''}
                                            placeholder="12345678A"
                                            className={`h-11 bg-slate-50 border-slate-100 rounded-lg text-sm font-semibold text-slate-700 ${errors.nif ? "border-rose-500 ring-rose-500/20" : "focus:ring-[#3b60c1]/20"}`}
                                        />
                                        {errors.nif && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">{errors.nif}</p>}
                                    </div>
                                    <div className="grid gap-2.5">
                                        <Label htmlFor="phone" className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Teléfono</Label>
                                        <Input
                                            id="phone" name="phone"
                                            defaultValue={employee.phone || ''}
                                            placeholder="600000000"
                                            className="h-11 bg-slate-50 border-slate-100 rounded-lg text-sm font-semibold text-slate-700 focus:ring-[#3b60c1]/20"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="grid gap-2.5">
                                        <Label htmlFor="social_security_number" className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Nº Seguridad Social</Label>
                                        <Input
                                            id="social_security_number" name="social_security_number"
                                            defaultValue={employee.social_security_number || ''}
                                            placeholder="28/12345678/90"
                                            className="h-11 bg-slate-50 border-slate-100 rounded-lg text-sm font-semibold text-slate-700 focus:ring-[#3b60c1]/20"
                                        />
                                    </div>
                                    <div className="grid gap-2.5">
                                        <Label htmlFor="role" className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Permisos en Sistema</Label>
                                        <Select name="role" defaultValue={employee.role}>
                                            <SelectTrigger className="h-11 bg-slate-50 border-slate-100 rounded-lg text-sm font-semibold text-slate-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-lg border-slate-100 shadow-xl">
                                                <SelectItem value="employee" className="font-semibold">EMPLEADO</SelectItem>
                                                <SelectItem value="manager" className="font-semibold">GESTOR</SelectItem>
                                                <SelectItem value="company_admin" className="font-semibold">ADMIN DE EMPRESA</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid gap-2.5">
                                    <Label htmlFor="department_id" className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Asignación de Departamento</Label>
                                    <Select name="department_id" defaultValue={employee.department_id || ''}>
                                        <SelectTrigger className="h-11 bg-slate-50 border-slate-100 rounded-lg text-sm font-semibold text-slate-700">
                                            <SelectValue placeholder="Selecciona un departamento" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg border-slate-100 shadow-xl">
                                            {departments?.map((dept) => (
                                                <SelectItem key={dept.id} value={dept.id} className="font-semibold">
                                                    {dept.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                                    <div className="grid gap-2.5">
                                        <Label htmlFor="status" className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Estado Contractual</Label>
                                        <Select name="status" defaultValue={employee.status || (employee.is_active ? 'active' : 'terminated')}>
                                            <SelectTrigger className="h-11 bg-slate-50 border-slate-100 rounded-lg text-sm font-semibold text-slate-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-lg border-slate-100 shadow-xl">
                                                <SelectItem value="active" className="font-semibold text-emerald-600">🟢 Activo / Alta</SelectItem>
                                                <SelectItem value="terminated" className="font-semibold text-rose-600">🔴 Baja Definitiva</SelectItem>
                                                <SelectItem value="medical_leave" className="font-semibold text-amber-600">🟠 Baja Médica (IT)</SelectItem>
                                                <SelectItem value="unpaid_leave" className="font-semibold text-purple-600">🟣 Excedencia</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2.5">
                                        <Label htmlFor="pin_code" className={`text-[11px] font-bold uppercase tracking-widest ml-1 ${errors.pin_code ? "text-rose-500" : "text-slate-500"}`}>Código PIN (Acceso Físico)</Label>
                                        <Input
                                            id="pin_code" name="pin_code"
                                            defaultValue={employee.pin_code || ''}
                                            maxLength={4}
                                            placeholder="XXXX"
                                            className={`h-11 bg-slate-50 border-slate-100 rounded-lg text-sm font-semibold text-slate-700 tracking-[0.5em] ${errors.pin_code ? "border-rose-500 ring-rose-500/20" : "focus:ring-[#3b60c1]/20"}`}
                                        />
                                        {errors.pin_code && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">{errors.pin_code}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6 border-t border-slate-100 pt-6">
                                    <div className="grid gap-2.5">
                                        <Label htmlFor="total_vacation_days" className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Días Vacaciones</Label>
                                        <Input
                                            type="number"
                                            id="total_vacation_days" name="total_vacation_days"
                                            defaultValue={employee.total_vacation_days ?? (settings?.default_vacation_days ?? 22)}
                                            className="h-11 font-bold text-[#3b60c1] bg-blue-50/50 border-blue-100 rounded-lg text-center text-lg"
                                        />
                                    </div>
                                    <div className="grid gap-2.5">
                                        <Label htmlFor="total_personal_days" className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Días L.D.</Label>
                                        <Input
                                            type="number"
                                            id="total_personal_days" name="total_personal_days"
                                            defaultValue={employee.total_personal_days ?? (settings?.default_personal_days ?? 0)}
                                            className="h-11 font-bold text-purple-600 bg-purple-50/50 border-purple-100 rounded-lg text-center text-lg"
                                        />
                                    </div>
                                    <div className="grid gap-2.5">
                                        <Label htmlFor="scheduled_hours" className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                                            Total Horas Semanales
                                        </Label>
                                        <Input
                                            type="number"
                                            id="scheduled_hours" name="scheduled_hours"
                                            step="0.5"
                                            value={scheduledHours}
                                            readOnly
                                            className="h-11 font-bold rounded-lg text-center text-lg shadow-inner bg-slate-50 text-[#3b60c1] border-slate-100 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="schedule" className="mt-0 hidden data-[state=active]:block" forceMount>
                                {schedulesLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <Loader2 className="h-10 w-10 animate-spin text-[#3b60c1]/20" strokeWidth={3} />
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Cargando Horarios...</p>
                                    </div>
                                ) : (
                                    <ScheduleTab
                                        userId={employee.id}
                                        scheduleType={scheduleType}
                                        schedules={schedules}
                                        onTypeChange={setScheduleType}
                                        onSchedulesChange={setSchedules}
                                    />
                                )}
                            </TabsContent>
                        </div>
                    </Tabs>

                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600">
                            Descartar
                        </Button>
                        <Button type="submit" disabled={loading} className="h-12 px-10 rounded-lg bg-[#3b60c1] hover:bg-[#2d4a94] font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-blue-200 transition-all hover:-translate-y-0.5 active:scale-95 min-w-[180px]">
                            {loading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando Cambios</>
                            ) : (
                                'Sincronizar Datos'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

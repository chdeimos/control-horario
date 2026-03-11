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
    pin_code: z.string().optional(),
    total_vacation_days: z.coerce.number().min(0, "No puede ser negativo"),
    total_personal_days: z.coerce.number().min(0, "No puede ser negativo"),
    scheduled_hours: z.coerce.number().min(0).max(24),
    status: z.enum(["active", "terminated", "medical_leave", "unpaid_leave"]).optional(),
    schedule_type: z.string().optional()
})

type FieldErrors = Record<string, string>

export function EditEmployeeDialog({ employee, departments, open, onOpenChange }: { employee: any, departments: any[], open: boolean, onOpenChange: (open: boolean) => void }) {
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<FieldErrors>({})
    const [scheduleType, setScheduleType] = useState(employee.schedule_type || 'flexible')
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

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setErrors({})
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        formData.set('schedule_type', scheduleType) // Ensure current selection is sent

        const nifInput = String(formData.get('nif')).trim().replace(/[\s.-]/g, '').toUpperCase()
        formData.set('nif', nifInput)

        const data = {
            full_name: String(formData.get('full_name')),
            nif: nifInput,
            email: employee.email,
            role: String(formData.get('role')),
            department_id: String(formData.get('department_id')),
            pin_code: String(formData.get('pin_code')),
            total_vacation_days: formData.get('total_vacation_days'),
            total_personal_days: formData.get('total_personal_days'),
            scheduled_hours: formData.get('scheduled_hours'),
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
            const res = await updateEmployee(employee.id, formData)
            if (res.error) throw new Error(res.error)

            // 2. Update Schedules (only if type is fixed, but we sync anyway)
            const resSchedules = await updateEmployeeSchedules(employee.id, schedules)
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
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="p-6 bg-slate-50 border-b">
                        <DialogTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-slate-500" />
                            Editar Empleado: {employee.email}
                        </DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6 h-12">
                            <TabsTrigger value="general" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none h-12 gap-2">
                                <User className="h-4 w-4" />
                                Datos Generales
                            </TabsTrigger>
                            <TabsTrigger value="schedule" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none h-12 gap-2">
                                <CalendarClock className="h-4 w-4" />
                                Horario Laboral
                            </TabsTrigger>
                        </TabsList>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <TabsContent value="general" className="mt-0 space-y-4 hidden data-[state=active]:block" forceMount>
                                <div className="grid gap-2">
                                    <input type="hidden" name="email" defaultValue={employee.email} />
                                    <Label htmlFor="full_name" className={errors.full_name ? "text-red-500" : ""}>Nombre Completo *</Label>
                                    <Input
                                        id="full_name" name="full_name"
                                        defaultValue={employee.full_name}
                                        className={errors.full_name ? "border-red-500" : ""}
                                    />
                                    {errors.full_name && <p className="text-xs text-red-500">{errors.full_name}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="nif" className={errors.nif ? "text-red-500" : ""}>NIF / DNI *</Label>
                                        <Input
                                            id="nif" name="nif"
                                            defaultValue={employee.nif || ''}
                                            placeholder="12345678A"
                                            className={errors.nif ? "border-red-500" : ""}
                                        />
                                        {errors.nif && <p className="text-xs text-red-500">{errors.nif}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Teléfono</Label>
                                        <Input
                                            id="phone" name="phone"
                                            defaultValue={employee.phone || ''}
                                            placeholder="600000000"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="social_security_number">Nº Seguridad Social</Label>
                                        <Input
                                            id="social_security_number" name="social_security_number"
                                            defaultValue={employee.social_security_number || ''}
                                            placeholder="28/12345678/90"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="role">Rol</Label>
                                        <Select name="role" defaultValue={employee.role}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="employee">Empleado</SelectItem>
                                                <SelectItem value="manager">Manager</SelectItem>
                                                <SelectItem value="company_admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="department_id">Departamento</Label>
                                    <Select name="department_id" defaultValue={employee.department_id || ''}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un departamento" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments?.map((dept) => (
                                                <SelectItem key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="status">Estado</Label>
                                        <Select name="status" defaultValue={employee.status || (employee.is_active ? 'active' : 'terminated')}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">🟢 Activo</SelectItem>
                                                <SelectItem value="terminated">🔴 Baja Definitiva</SelectItem>
                                                <SelectItem value="medical_leave">🟠 Baja Médica</SelectItem>
                                                <SelectItem value="unpaid_leave">🟣 Excedencia</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="pin_code">PIN Físico</Label>
                                        <Input id="pin_code" name="pin_code" defaultValue={employee.pin_code || ''} maxLength={6} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 border-t pt-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="total_vacation_days font-bold">Días Vacaciones</Label>
                                        <Input
                                            type="number"
                                            id="total_vacation_days" name="total_vacation_days"
                                            defaultValue={employee.total_vacation_days ?? 22}
                                            className="font-bold text-blue-600 bg-blue-50/20"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="total_personal_days font-bold">Días Libre Disp.</Label>
                                        <Input
                                            type="number"
                                            id="total_personal_days" name="total_personal_days"
                                            defaultValue={employee.total_personal_days ?? 0}
                                            className="font-bold text-purple-600 bg-purple-50/20"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="scheduled_hours font-bold">H. Diarias Contratadas</Label>
                                        <Input
                                            type="number"
                                            id="scheduled_hours" name="scheduled_hours"
                                            step="0.5"
                                            defaultValue={employee.scheduled_hours ?? 8.0}
                                            className="font-bold text-slate-900 bg-slate-100"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground italic px-1">
                                    * "H. Diarias Contratadas" se utiliza como base para el cálculo de excesos y ausencias cuando el horario es flexible.
                                </p>
                            </TabsContent>

                            <TabsContent value="schedule" className="mt-0 hidden data-[state=active]:block" forceMount>
                                {schedulesLoading ? (
                                    <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>
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

                    <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading} className="min-w-[140px]">
                            {loading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                            ) : (
                                'Guardar Todo'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

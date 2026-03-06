'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { getEmployeeSchedules } from './actions'
import { Loader2, Plus, Trash2, Clock } from 'lucide-react'

const DAYS = [
    { id: 1, name: 'Lunes' },
    { id: 2, name: 'Martes' },
    { id: 3, name: 'Miércoles' },
    { id: 4, name: 'Jueves' },
    { id: 5, name: 'Viernes' },
    { id: 6, name: 'Sábado' },
    { id: 7, name: 'Domingo' },
]

export function ScheduleTab({
    userId,
    scheduleType,
    schedules,
    onTypeChange,
    onSchedulesChange
}: {
    userId: string,
    scheduleType: string,
    schedules: any[],
    onTypeChange: (type: string) => void,
    onSchedulesChange: (schedules: any[]) => void
}) {
    function updateDay(dayId: number, field: string, value: any) {
        const newSchedules = [...schedules]
        const index = newSchedules.findIndex(s => Number(s.day_of_week) === dayId)

        if (index === -1) {
            if (value === null || value === false) return
            newSchedules.push({ day_of_week: dayId, start_time: '09:00', end_time: '18:00', [field]: value })
        } else {
            if ((value === null || value === false) && field === 'is_active') {
                newSchedules.splice(index, 1)
            } else {
                newSchedules[index] = { ...newSchedules[index], [field]: value }
            }
        }
        onSchedulesChange(newSchedules)
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 p-4 bg-slate-50 rounded-lg border">
                <div className="space-y-2">
                    <Label>Tipo de Horario</Label>
                    <Select value={scheduleType} onValueChange={onTypeChange}>
                        <SelectTrigger className="bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="flexible">Horario Libre (Basado en total de horas)</SelectItem>
                            <SelectItem value="fixed">Horario Fijo Semanal (Horas específicas)</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        {scheduleType === 'flexible'
                            ? "El empleado puede fichar a cualquier hora hasta completar su jornada contratada."
                            : "Se definen horas de entrada y salida obligatorias para cada día de la semana."}
                    </p>
                </div>
            </div>

            {scheduleType === 'fixed' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-2 px-2 text-[10px] font-bold uppercase text-slate-400">
                        <div className="col-span-3">Día</div>
                        <div className="col-span-2 text-center">Entrada 1</div>
                        <div className="col-span-2 text-center">Salida 1</div>
                        <div className="col-span-2 text-center">Entrada 2</div>
                        <div className="col-span-2 text-center">Salida 2</div>
                        <div className="col-span-1"></div>
                    </div>

                    {DAYS.map((day) => {
                        const daySchedule = schedules.find(s => Number(s.day_of_week) === day.id)
                        const isActive = !!daySchedule

                        return (
                            <div key={day.id} className={`grid grid-cols-12 gap-2 items-center p-2 rounded-md transition-colors ${isActive ? 'bg-white border shadow-sm' : 'bg-slate-50/50 opacity-60'}`}>
                                <div className="col-span-3 flex items-center gap-2">
                                    <Checkbox
                                        checked={isActive}
                                        onCheckedChange={(checked) => {
                                            updateDay(day.id, 'is_active', !!checked)
                                        }}
                                    />
                                    <span className="text-sm font-medium">{day.name}</span>
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        type="time"
                                        disabled={!isActive}
                                        value={daySchedule?.start_time ? String(daySchedule.start_time).substring(0, 5) : ''}
                                        onChange={(e) => updateDay(day.id, 'start_time', e.target.value)}
                                        className="h-8 text-xs p-1"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        type="time"
                                        disabled={!isActive}
                                        value={daySchedule?.end_time ? String(daySchedule.end_time).substring(0, 5) : ''}
                                        onChange={(e) => updateDay(day.id, 'end_time', e.target.value)}
                                        className="h-8 text-xs p-1"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        type="time"
                                        disabled={!isActive}
                                        value={daySchedule?.start_time_2 ? String(daySchedule.start_time_2).substring(0, 5) : ''}
                                        onChange={(e) => updateDay(day.id, 'start_time_2', e.target.value)}
                                        className="h-8 text-xs p-1 border-dashed"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        type="time"
                                        disabled={!isActive}
                                        value={daySchedule?.end_time_2 ? String(daySchedule.end_time_2).substring(0, 5) : ''}
                                        onChange={(e) => updateDay(day.id, 'end_time_2', e.target.value)}
                                        className="h-8 text-xs p-1 border-dashed"
                                    />
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    {(daySchedule?.start_time_2 || daySchedule?.end_time_2) && (
                                        <Button
                                            type="button"
                                            variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-500"
                                            onClick={() => {
                                                updateDay(day.id, 'start_time_2', null)
                                                updateDay(day.id, 'end_time_2', null)
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )
                    })}

                    <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex gap-3">
                        <Clock className="h-4 w-4 text-blue-500 mt-0.5" />
                        <p className="text-[11px] text-blue-700 leading-relaxed">
                            <strong>Consejo:</strong> Para turnos partidos, rellena los campos "Entrada 2" y "Salida 2".
                            Si el sistema detecta entradas fuera de este horario pero dentro de las horas contratadas, podrá marcarlas como "exceso" o "incidencia" según la configuración.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

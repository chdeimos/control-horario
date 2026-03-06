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
        <div className="space-y-8">
            <div className="grid gap-4 p-6 bg-slate-50/50 rounded-lg border border-slate-100">
                <div className="space-y-3">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Modelo de Jornada</Label>
                    <Select value={scheduleType} onValueChange={onTypeChange}>
                        <SelectTrigger className="h-12 bg-white border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 shadow-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border-slate-100 shadow-xl">
                            <SelectItem value="flexible" className="font-bold">Horario Flexible (Total de horas)</SelectItem>
                            <SelectItem value="fixed" className="font-bold">Horario Rígido (Control de entrada/salida)</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 px-1">
                        <div className="w-1 h-1 bg-[#3b60c1] rounded-full"></div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            {scheduleType === 'flexible'
                                ? "Cálculo basado en horas totales trabajadas sin restricciones de franja."
                                : "Cálculo basado en cumplimiento estricto de los tramos horarios definidos."}
                        </p>
                    </div>
                </div>
            </div>

            {scheduleType === 'flexible' ? (
                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-12 gap-4 px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400/80">
                        <div className="col-span-8">Día Laborable</div>
                        <div className="col-span-4 text-center">Horas Objetivo</div>
                    </div>

                    <div className="space-y-2">
                        {DAYS.map((day) => {
                            const daySchedule = schedules.find(s => Number(s.day_of_week) === day.id)
                            const isActive = !!daySchedule
                            return (
                                <div
                                    key={day.id}
                                    className={`grid grid-cols-12 gap-4 items-center px-6 py-4 rounded-lg border transition-all duration-300 group ${isActive
                                        ? 'bg-white border-blue-200 shadow-lg shadow-slate-200/40 ring-1 ring-[#3b60c1]/5'
                                        : 'bg-slate-50/50 border-slate-100 hover:border-slate-200 opacity-60'
                                        }`}
                                >
                                    <div className="col-span-8 flex items-center gap-4">
                                        <Checkbox
                                            id={`flex-day-${day.id}`}
                                            checked={isActive}
                                            onCheckedChange={(checked) => {
                                                updateDay(day.id, 'is_active', !!checked)
                                            }}
                                            className="h-5 w-5 rounded-[4px] border-slate-300 data-[state=checked]:bg-[#3b60c1] data-[state=checked]:border-[#3b60c1] transition-transform active:scale-90"
                                        />
                                        <label
                                            htmlFor={`flex-day-${day.id}`}
                                            className={`text-[11px] font-semibold uppercase tracking-widest cursor-pointer select-none transition-colors ${isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-500'}`}
                                        >
                                            {day.name}
                                        </label>
                                    </div>

                                    <div className="col-span-4 flex justify-center">
                                        {isActive ? (
                                            <div className="relative group/input w-full max-w-[120px]">
                                                <Label htmlFor={`horario-flexible-input-${day.id}`} className="sr-only">
                                                    Horas objetivo para {day.name}
                                                </Label>
                                                <Input
                                                    id={`horario-flexible-input-${day.id}`}
                                                    type="number"
                                                    step="0.5"
                                                    min="0"
                                                    max="24"
                                                    value={daySchedule?.target_total_hours ?? 8}
                                                    onChange={(e) => updateDay(day.id, 'target_total_hours', parseFloat(e.target.value))}
                                                    className="w-full h-10 bg-blue-50/30 border-blue-100/50 rounded-lg text-[13px] font-bold text-center text-[#3b60c1] focus:ring-4 focus:ring-[#3b60c1]/10 focus:border-[#3b60c1] transition-all pr-8 tabular-nums"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-400 pointer-events-none">
                                                    H
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="px-3 py-1.5 rounded-lg border border-dashed border-slate-200">
                                                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">Inactivo</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : (
                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-12 gap-4 px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400/80">
                        <div className="col-span-3">Día Laborable</div>
                        <div className="col-span-2 text-center">Entrada 1</div>
                        <div className="col-span-2 text-center">Salida 1</div>
                        <div className="col-span-2 text-center">Entrada 2</div>
                        <div className="col-span-2 text-center">Salida 2</div>
                        <div className="col-span-1"></div>
                    </div>

                    <div className="space-y-2">
                        {DAYS.map((day) => {
                            const daySchedule = schedules.find(s => Number(s.day_of_week) === day.id)
                            const isActive = !!daySchedule

                            return (
                                <div key={day.id} className={`grid grid-cols-12 gap-4 items-center px-6 py-4 rounded-lg transition-all duration-300 border group ${isActive
                                    ? 'bg-white border-blue-200 shadow-lg shadow-slate-200/40 ring-1 ring-[#3b60c1]/5'
                                    : 'bg-slate-50/50 border-slate-100 hover:border-slate-200 opacity-60'
                                    }`}>
                                    <div className="col-span-3 flex items-center gap-4">
                                        <Checkbox
                                            id={`fixed-day-${day.id}`}
                                            checked={isActive}
                                            onCheckedChange={(checked) => {
                                                updateDay(day.id, 'is_active', !!checked)
                                            }}
                                            className="h-5 w-5 rounded-[4px] border-slate-300 data-[state=checked]:bg-[#3b60c1] data-[state=checked]:border-[#3b60c1] transition-transform active:scale-90"
                                        />
                                        <label
                                            htmlFor={`fixed-day-${day.id}`}
                                            className={`text-[11px] font-semibold uppercase tracking-widest cursor-pointer select-none transition-colors ${isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-500'}`}
                                        >
                                            {day.name}
                                        </label>
                                    </div>
                                    <div className="col-span-2">
                                        <Label htmlFor={`start-1-${day.id}`} className="sr-only">Entrada 1 {day.name}</Label>
                                        <Input
                                            id={`start-1-${day.id}`}
                                            type="time"
                                            disabled={!isActive}
                                            value={daySchedule?.start_time ? String(daySchedule.start_time).substring(0, 5) : ''}
                                            onChange={(e) => updateDay(day.id, 'start_time', e.target.value)}
                                            className="h-10 bg-slate-50/50 border-slate-100 rounded-lg text-[12px] font-semibold text-center tabular-nums focus:ring-4 focus:ring-[#3b60c1]/10 focus:border-[#3b60c1] transition-all disabled:opacity-30"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label htmlFor={`end-1-${day.id}`} className="sr-only">Salida 1 {day.name}</Label>
                                        <Input
                                            id={`end-1-${day.id}`}
                                            type="time"
                                            disabled={!isActive}
                                            value={daySchedule?.end_time ? String(daySchedule.end_time).substring(0, 5) : ''}
                                            onChange={(e) => updateDay(day.id, 'end_time', e.target.value)}
                                            className="h-10 bg-slate-50/50 border-slate-100 rounded-lg text-[12px] font-semibold text-center tabular-nums focus:ring-4 focus:ring-[#3b60c1]/10 focus:border-[#3b60c1] transition-all disabled:opacity-30"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label htmlFor={`start-2-${day.id}`} className="sr-only">Entrada 2 {day.name}</Label>
                                        <Input
                                            id={`start-2-${day.id}`}
                                            type="time"
                                            disabled={!isActive}
                                            value={daySchedule?.start_time_2 ? String(daySchedule.start_time_2).substring(0, 5) : ''}
                                            onChange={(e) => updateDay(day.id, 'start_time_2', e.target.value)}
                                            className="h-10 bg-slate-50/20 border-slate-100 border-dashed rounded-lg text-[12px] font-semibold text-center tabular-nums opacity-60 focus:opacity-100 transition-all disabled:opacity-10"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label htmlFor={`end-2-${day.id}`} className="sr-only">Salida 2 {day.name}</Label>
                                        <Input
                                            id={`end-2-${day.id}`}
                                            type="time"
                                            disabled={!isActive}
                                            value={daySchedule?.end_time_2 ? String(daySchedule.end_time_2).substring(0, 5) : ''}
                                            onChange={(e) => updateDay(day.id, 'end_time_2', e.target.value)}
                                            className="h-10 bg-slate-50/20 border-slate-100 border-dashed rounded-lg text-[12px] font-semibold text-center tabular-nums opacity-60 focus:opacity-100 transition-all disabled:opacity-10"
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        {(daySchedule?.start_time_2 || daySchedule?.end_time_2) && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                onClick={() => {
                                                    updateDay(day.id, 'start_time_2', null)
                                                    updateDay(day.id, 'end_time_2', null)
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {isActive && !daySchedule?.start_time_2 && (
                                            <div className="w-2 h-2 rounded-full bg-[#3b60c1] shadow-sm shadow-blue-200 animate-pulse"></div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/30 rounded-lg border border-blue-100/50 flex gap-4">
                        <div className="h-10 w-10 bg-white rounded-lg shadow-sm flex items-center justify-center shrink-0">
                            <Clock className="h-5 w-5 text-[#3b60c1]" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#3b60c1]">Configuración de Tramos</p>
                            <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                                Para jornadas partidas, utilice los campos Entrada 2 y Salida 2. El sistema validará los fichajes realizados tanto en el primer tramo como en el segundo para el cálculo de puntualidad.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

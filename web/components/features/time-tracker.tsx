'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Clock, MapPin, StopCircle, PlayCircle, Loader2, MapIcon } from "lucide-react"
import { clockIn, clockOut, getLastEntry } from '@/app/(dashboard)/time-tracking/actions'
import { useRouter } from 'next/navigation'

export function TimeTracker({ isNonWorkingDay = false }: { isNonWorkingDay?: boolean }) {
    const [loading, setLoading] = useState(false)
    const [activeEntry, setActiveEntry] = useState<any>(null)
    const [elapsed, setElapsed] = useState<string>("00:00:00")
    const [geoError, setGeoError] = useState<{ type: 'denied' | 'unsupported' | 'error', message: string } | null>(null)
    const router = useRouter()

    useEffect(() => {
        checkStatus()
        checkGeolocation()
    }, [])

    async function checkGeolocation(isManual = false) {
        if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
            setGeoError({
                type: 'unsupported',
                message: "Estás accediendo mediante una conexión no segura (HTTP). El GPS solo funciona en conexiones seguras (HTTPS) o localhost."
            })
            return
        }

        if (!navigator.geolocation) {
            setGeoError({ type: 'unsupported', message: "Tu dispositivo no soporta geolocalización." })
            return
        }

        if (isManual) setLoading(true);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                console.log("GPS OK:", pos.coords.latitude, pos.coords.longitude);
                setGeoError(null)
                if (isManual) setLoading(false);
            },
            (error) => {
                let msg = "Acceso a la ubicación necesario."
                if (error.code === error.PERMISSION_DENIED) {
                    msg = "Ubicación bloqueada. Actívala en los ajustes de tu navegador o móvil (en Brave, revisa los 'Escudos')."
                } else if (error.code === error.TIMEOUT) {
                    msg = "Tiempo de espera agotado. Asegúrate de tener buena señal GPS y los permisos concedidos."
                }
                setGeoError({ type: 'denied', message: msg })
                if (isManual) setLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 0
            }
        )
    }

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (activeEntry) {
            interval = setInterval(() => {
                const start = new Date(activeEntry.clock_in).getTime()
                const now = new Date().getTime()
                const diff = now - start

                const hours = Math.floor(diff / (1000 * 60 * 60))
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                const seconds = Math.floor((diff % (1000 * 60)) / 1000)

                setElapsed(
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                )
            }, 1000)
        } else {
            setElapsed("00:00:00")
        }
        return () => clearInterval(interval)
    }, [activeEntry])

    async function checkStatus() {
        const entry = await getLastEntry()
        setActiveEntry(entry)
    }

    async function handleClockIn() {
        setLoading(true)
        if (!navigator.geolocation) {
            setGeoError({ type: 'unsupported', message: "Tu dispositivo no soporta geolocalización." })
            setLoading(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords
                const result = await clockIn(latitude, longitude)
                if (result?.error) {
                    alert('Error: ' + result.error)
                } else {
                    await checkStatus()
                    router.refresh()
                    setGeoError(null)
                }
                setLoading(false)
            },
            async (error) => {
                let msg = "No se ha podido obtener tu ubicación."
                if (error.code === error.PERMISSION_DENIED) {
                    msg = "Ubicación bloqueada. Revisa los permisos de tu navegador o los ajustes del móvil."
                    setGeoError({ type: 'denied', message: msg })
                } else {
                    setGeoError({ type: 'error', message: "Error de GPS: " + error.message })
                }
                setLoading(false)
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        )
    }

    async function handleClockOut() {
        setLoading(true)
        if (!navigator.geolocation) {
            setGeoError({ type: 'unsupported', message: "Tu dispositivo no soporta geolocalización." })
            setLoading(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords
                const result = await clockOut(latitude, longitude)
                if (result?.error) {
                    alert('Error: ' + result.error)
                } else {
                    setActiveEntry(null)
                    router.refresh()
                    setGeoError(null)
                }
                setLoading(false)
            },
            async (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                    setGeoError({ type: 'denied', message: "Acceso a ubicación denegado. Actívalo para poder cerrar la jornada." })
                } else {
                    setGeoError({ type: 'error', message: "Error de GPS: " + error.message })
                }
                setLoading(false)
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
    }

    return (
        <div className="flex flex-col items-center gap-6 md:gap-10 w-full max-w-sm">
            {/* digital Clock Area */}
            <div className="flex flex-col items-center w-full">
                <span className={`text-[11px] md:text-sm font-black uppercase tracking-[0.3em] mb-4 md:mb-1 ${activeEntry ? 'text-blue-400' : 'text-white/40 md:text-slate-400'}`}>
                    {activeEntry ? 'En Curso' : 'Listo'}
                </span>

                {/* Clock Display in Recessed Box (Desktop) or Dark Background (Mobile) */}
                <div className="w-full bg-transparent md:bg-[#f8fafd] rounded-xl md:py-12 md:px-8 md:border border-slate-100/50 md:shadow-inner flex items-center justify-center">
                    <div className={`text-7xl md:text-7xl font-manrope font-black tracking-tighter tabular-nums ${activeEntry ? 'text-white md:text-blue-600' : 'text-white md:text-slate-900'}`}>
                        {elapsed}
                    </div>
                </div>
            </div>

            {/* Main Action Button - Matching the image blue */}
            <div className="w-full pt-4 md:pt-0">
                {activeEntry ? (
                    <Button
                        size="lg"
                        className="w-full h-18 text-lg font-black rounded-[20px] md:rounded-lg shadow-xl bg-rose-600 hover:bg-rose-700 text-white transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        onClick={handleClockOut}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin h-6 w-6" /> : <StopCircle className="h-6 w-6" />}
                        FINALIZAR JORNADA
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        className={`w-full h-18 text-lg font-black rounded-full md:rounded-lg shadow-2xl shadow-blue-500/20 bg-[#3b60c1] hover:bg-[#2d4a94] text-white transition-all active:scale-[0.98] flex items-center justify-center gap-3 py-4 ${isNonWorkingDay ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={handleClockIn}
                        disabled={loading || isNonWorkingDay}
                    >
                        {loading ? <Loader2 className="animate-spin h-6 w-6" /> : <PlayCircle className="h-7 w-7" fill="currentColor" />}
                        {isNonWorkingDay ? 'SISTEMA BLOQUEADO' : 'Iniciar Jornada'}
                    </Button>
                )}
            </div>

            {/* Geolocation Status - Image style match */}
            <div className="flex items-center gap-2 text-white/40 uppercase tracking-[0.15em] font-black text-[9px] md:text-slate-400 mt-2">
                <MapIcon size={14} strokeWidth={2.5} />
                <span>Geolocalización Requerida</span>
            </div>

            {/* Error Message if any */}
            {geoError && (
                <div className="w-full bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-center">
                    <p className="text-rose-400 text-[10px] font-bold leading-relaxed">
                        {geoError.message}
                    </p>
                </div>
            )}
        </div>
    )
}

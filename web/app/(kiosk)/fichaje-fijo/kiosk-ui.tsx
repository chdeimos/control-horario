'use client'

import { useState, useEffect, useCallback } from 'react'
import { kioskClockAction } from './actions'
import { motion, AnimatePresence } from 'framer-motion'
import { Delete, CheckCircle2, Clock, LogIn, LogOut, Loader2 } from 'lucide-react'

interface KioskUIProps {
    token: string
    company: any
    settings: any
}

export function KioskUI({ token, company, settings }: KioskUIProps) {
    const [pin, setPin] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [result, setResult] = useState<any>(null)
    const [errorMsg, setErrorMsg] = useState('')
    const [idleTimer, setIdleTimer] = useState<NodeJS.Timeout | null>(null)

    const resetState = useCallback(() => {
        setPin('')
        setStatus('idle')
        setResult(null)
        setErrorMsg('')
    }, [])

    // Idle Cleanup (10s)
    useEffect(() => {
        if (pin.length > 0 && status === 'idle') {
            if (idleTimer) clearTimeout(idleTimer)
            const timer = setTimeout(() => {
                setPin('')
            }, (parseInt(settings.idle) || 10) * 1000)
            setIdleTimer(timer)
        }
        return () => { if (idleTimer) clearTimeout(idleTimer) }
    }, [pin, status, settings.idle])

    // Auto-Reset after success (30s)
    useEffect(() => {
        if (status === 'success' || status === 'error') {
            const timer = setTimeout(() => {
                resetState()
            }, (status === 'success' ? (parseInt(settings.reset) || 30) : 5) * 1000)
            return () => clearTimeout(timer)
        }
    }, [status, settings.reset, resetState])

    const handleInput = (digit: string) => {
        if (status !== 'idle' || pin.length >= 4) return
        setPin(prev => prev + digit)
    }

    const handleDelete = () => {
        if (status !== 'idle') return
        setPin(prev => prev.slice(0, -1))
    }

    useEffect(() => {
        if (pin.length === 4) {
            handleClocking()
        }
    }, [pin])

    const handleClocking = async () => {
        setStatus('loading')
        const res = await kioskClockAction(token, pin)
        if (res.error) {
            setStatus('error')
            setErrorMsg(res.error)
        } else {
            setStatus('success')
            setResult(res)
        }
    }

    // Resolving company image from settings or default
    const companyImage = company.settings?.kiosk_image_url || settings.defaultImage

    return (
        <div className="flex h-screen w-full overflow-hidden bg-black font-sans">
            {/* Left Side: Branding/Image */}
            <div className="hidden md:flex w-1/2 relative overflow-hidden border-r border-white/5">
                {companyImage ? (
                    <img
                        src={companyImage}
                        alt={company.name}
                        className="w-full h-full object-cover grayscale opacity-60 hover:grayscale-0 transition-all duration-1000"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900/40">
                        <h2 className="text-4xl font-bold text-white/10 uppercase tracking-[0.3em] rotate-90">{company.name}</h2>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black"></div>

                <div className="absolute bottom-12 left-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-[2px] w-12 bg-primary"></div>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-[0.4em]">Fichaje Kiosko v2.0</p>
                    </div>
                    <h1 className="text-6xl font-bold text-white uppercase tracking-tighter italic">
                        {company.name}
                    </h1>
                </div>
            </div>

            {/* Right Side: Logic */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 md:p-16 relative">
                <AnimatePresence mode="wait">
                    {status === 'idle' || status === 'loading' ? (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-sm space-y-12"
                        >
                            <div className="text-center space-y-4">
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.5em]">Identificación Requerida</h2>
                                <div className="flex justify-center gap-6">
                                    {[0, 1, 2, 3].map(i => (
                                        <div
                                            key={i}
                                            className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${pin.length > i
                                                ? 'bg-primary border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                                                : 'border-white/10'
                                                }`}
                                        ></div>
                                    ))}
                                </div>
                            </div>

                            {status === 'loading' ? (
                                <div className="flex flex-col items-center justify-center h-[400px]">
                                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mt-8 animate-pulse">Sincronizando Sistema...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-4 md:gap-6 h-[400px]">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => handleInput(n.toString())}
                                            className="h-full rounded-2xl bg-white/[0.03] border border-white/5 text-2xl font-bold hover:bg-primary/10 hover:border-primary/20 active:scale-95 transition-all outline-none"
                                        >
                                            {n}
                                        </button>
                                    ))}
                                    <div className="h-full"></div>
                                    <button
                                        onClick={() => handleInput('0')}
                                        className="h-full rounded-2xl bg-white/[0.03] border border-white/5 text-2xl font-bold hover:bg-primary/10 hover:border-primary/20 active:scale-95 transition-all outline-none"
                                    >
                                        0
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="h-full rounded-2xl flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-500/5 active:scale-95 transition-all outline-none"
                                    >
                                        <Delete size={28} />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ) : status === 'success' ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-8"
                        >
                            <div className="flex justify-center">
                                <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.3)]">
                                    <CheckCircle2 size={48} className="text-black" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.4em]">Operación Exitosa</p>
                                <h2 className="text-4xl font-bold text-white uppercase italic tracking-tighter">
                                    {result.fullName}
                                </h2>
                            </div>

                            <div className="flex items-center justify-center gap-12 bg-white/[0.03] border border-white/5 p-8 rounded-3xl">
                                <div className="text-center">
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Acción</p>
                                    <div className={`flex items-center gap-2 font-bold uppercase text-lg ${result.type === 'in' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {result.type === 'in' ? <LogIn size={18} /> : <LogOut size={18} />}
                                        {result.type === 'in' ? 'Entrada' : 'Salida'}
                                    </div>
                                </div>
                                <div className="w-[1px] h-10 bg-white/10"></div>
                                <div className="text-center">
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Timestamp</p>
                                    <div className="flex items-center gap-2 font-bold text-white text-lg tabular-nums">
                                        <Clock size={18} className="text-slate-500" />
                                        {result.time}
                                    </div>
                                </div>
                            </div>

                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest animate-pulse mt-8">
                                Regresando en {settings.reset} segundos...
                            </p>

                            <button
                                onClick={resetState}
                                className="w-full mt-12 py-6 bg-primary text-black rounded-2xl font-bold uppercase tracking-[0.3em] text-xs hover:bg-cyan-400 active:scale-95 transition-all shadow-[0_20px_50px_rgba(6,182,212,0.25)] flex items-center justify-center gap-3"
                            >
                                <CheckCircle2 size={18} strokeWidth={3} />
                                Finalizar y Volver
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-8"
                        >
                            <div className="flex justify-center">
                                <div className="w-24 h-24 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.4em]">Error de Acceso</p>
                                <h2 className="text-2xl font-bold text-white uppercase tracking-tight max-w-xs mx-auto">
                                    {errorMsg}
                                </h2>
                            </div>
                            <button
                                onClick={resetState}
                                className="px-8 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                            >
                                Reintentar
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer cleaned */}
                <div className="absolute bottom-8 left-0 right-0 text-center opacity-10">
                    <p className="text-[8px] font-bold uppercase tracking-[0.3em]">
                        Terminal de Control de Horario
                    </p>
                </div>
            </div>
        </div>
    )
}

'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Loader2, KeyRound, Mail, UserCircle } from 'lucide-react'
import { createCompanyAdmin } from './actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function AddAdminDialog({ companyId, companyName }: { companyId: string, companyName: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        const formData = new FormData(event.currentTarget)
        const res = await createCompanyAdmin(companyId, formData)
        setLoading(false)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Privilegios de administración otorgados con éxito')
            setOpen(false)
            router.refresh()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10 px-4 rounded-xl bg-slate-50 border border-slate-100 text-[#3b60c1] hover:bg-[#3b60c1] hover:text-white transition-all text-[9px] font-black uppercase tracking-widest gap-2 shadow-sm">
                    <UserPlus size={14} />
                    Asignar Admin
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-none rounded-3xl shadow-2xl p-0 overflow-hidden max-w-md animate-in zoom-in-95 duration-300">
                <div className="h-2 bg-[#3b60c1]"></div>

                <DialogHeader className="p-10 pb-0">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-50 text-[#3b60c1] rounded-2xl flex items-center justify-center">
                            <KeyRound size={24} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">
                                Protocolo de Acceso
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">
                                Autorización Root para: <span className="text-[#3b60c1]">{companyName}</span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-10 space-y-10">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label htmlFor="full_name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Identidad del Operador</Label>
                            <div className="relative group">
                                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#3b60c1] transition-colors" />
                                <Input
                                    id="full_name"
                                    name="full_name"
                                    placeholder="NOMBRE COMPLETO"
                                    required
                                    className="h-14 pl-12 bg-slate-50 border-slate-100 rounded-2xl text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Terminal de Comunicación (EMAIL)</Label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#3b60c1] transition-colors" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="ADMIN@INSTANCIA.COM"
                                    required
                                    className="h-14 pl-12 bg-slate-50 border-slate-100 rounded-2xl text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-blue-100/50 focus:border-[#3b60c1] transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="flex-1 h-14 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all"
                        >
                            Abortar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] h-14 bg-[#3b60c1] hover:bg-[#2d4a94] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95"
                        >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    OTORGANDO...
                                </div>
                            ) : 'OTORGAR PRIVILEGIOS'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

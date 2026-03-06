'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2, Edit2, Plus, Loader2 } from "lucide-react"
import { createDepartment, deleteDepartment, updateDepartment } from './actions'
import { toast } from 'sonner'

interface Department {
    id: string
    name: string
    company_id: string
    created_at: string
}

export function DepartmentsTab({ departments }: { departments: Department[] }) {
    const [openCreator, setOpenCreator] = useState(false)
    const [editingDept, setEditingDept] = useState<Department | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        const formData = new FormData(event.currentTarget)
        const res = await createDepartment(formData)
        setLoading(false)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Departamento creado')
            setOpenCreator(false)
        }
    }

    async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!editingDept) return
        setLoading(true)
        const formData = new FormData(event.currentTarget)
        const name = String(formData.get('name'))
        const res = await updateDepartment(editingDept.id, name)
        setLoading(false)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Departamento actualizado')
            setEditingDept(null)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Seguro que quieres eliminar este departamento?')) return
        const res = await deleteDepartment(id)
        if (res.error) toast.error(res.error)
        else toast.success('Departamento eliminado')
    }

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-lg border border-slate-100 shadow-2xl shadow-slate-900/5">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="h-6 w-1 bg-amber-500 rounded-full"></div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Estructura Organizacional</h2>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Gestión y control de departamentos internos</p>
                </div>

                <Dialog open={openCreator} onOpenChange={setOpenCreator}>
                    <DialogTrigger asChild>
                        <Button className="h-12 px-8 bg-[#3b60c1] hover:bg-[#2d4a94] text-white rounded-lg font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-blue-200 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-3">
                            <Plus size={16} />
                            Nuevo Departamento
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-lg border-slate-100 shadow-2xl p-0 overflow-hidden outline-none">
                        <DialogHeader className="p-8 bg-slate-50/50 border-b border-slate-100 text-left">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-6 bg-[#3b60c1] rounded-full"></div>
                                <DialogTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Alta de Departamento</DialogTitle>
                            </div>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="p-10 space-y-8">
                            <div className="space-y-4">
                                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nombre de la Sección</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    placeholder="Ej: Marketing, IT, RRHH..."
                                    className="h-12 bg-white border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 shadow-sm transition-all placeholder:text-slate-300"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setOpenCreator(false)}
                                    className="h-12 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="h-12 px-10 bg-[#3b60c1] hover:bg-[#2d4a94] text-white rounded-lg font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-blue-200 transition-all hover:-translate-y-0.5 active:scale-95"
                                >
                                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Confirmar Alta'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-lg border border-slate-100 bg-white shadow-2xl shadow-slate-900/5 overflow-hidden">
                <Table className="w-full table-fixed">
                    <TableHeader>
                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                            <TableHead className="h-14 px-8 text-[10px] font-black uppercase tracking-widest text-slate-500">Nombre del Departamento</TableHead>
                            <TableHead className="h-14 px-8 w-[150px] text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Gestión</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {departments.map((dept) => (
                            <TableRow key={dept.id} className="group hover:bg-blue-50/30 transition-colors">
                                <TableCell className="h-20 px-8">
                                    <div className="flex flex-col">
                                        <span className="text-base font-black text-slate-900 tracking-tight group-hover:text-[#3b60c1] transition-colors">{dept.name}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 tabular-nums">ID: {dept.id.split('-')[0].toUpperCase()}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="h-20 px-8 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Dialog open={!!editingDept && editingDept.id === dept.id} onOpenChange={(o) => !o && setEditingDept(null)}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setEditingDept(dept)}
                                                    className="h-10 w-10 rounded-lg hover:bg-blue-50 group/edit transition-all"
                                                >
                                                    <Edit2 className="h-4 w-4 text-slate-300 group-hover/edit:text-[#3b60c1] transition-colors" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px] rounded-lg border-slate-100 shadow-2xl p-0 overflow-hidden outline-none">
                                                <DialogHeader className="p-8 bg-slate-50/50 border-b border-slate-100 text-left">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
                                                        <DialogTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Editar Sección</DialogTitle>
                                                    </div>
                                                </DialogHeader>
                                                <form onSubmit={handleUpdate} className="p-10 space-y-8">
                                                    <div className="space-y-4">
                                                        <Label htmlFor="edit-name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nuevo Nombre del Departamento</Label>
                                                        <Input
                                                            id="edit-name"
                                                            name="name"
                                                            required
                                                            defaultValue={dept.name}
                                                            className="h-12 bg-white border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 shadow-sm transition-all"
                                                        />
                                                    </div>
                                                    <div className="flex justify-end gap-3 pt-4">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            onClick={() => setEditingDept(null)}
                                                            className="h-12 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                                                        >
                                                            Cancelar
                                                        </Button>
                                                        <Button
                                                            type="submit"
                                                            disabled={loading}
                                                            className="h-12 px-10 bg-[#3b60c1] hover:bg-[#2d4a94] text-white rounded-lg font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-blue-200 transition-all hover:-translate-y-0.5 active:scale-95"
                                                        >
                                                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Guardar Cambios'}
                                                        </Button>
                                                    </div>
                                                </form>
                                            </DialogContent>
                                        </Dialog>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(dept.id)}
                                            className="h-10 w-10 rounded-lg hover:bg-red-50 group/del transition-all"
                                        >
                                            <Trash2 className="h-4 w-4 text-slate-300 group-hover/del:text-red-500 transition-colors" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {departments.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} className="h-40 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="p-4 bg-slate-50 rounded-lg">
                                            <Trash2 className="h-6 w-6 text-slate-200" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No hay departamentos registrados</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

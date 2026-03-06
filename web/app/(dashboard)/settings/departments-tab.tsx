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
    DialogFooter
} from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"
import { createDepartment, deleteDepartment } from './actions'

interface Department {
    id: string
    name: string
    company_id: string
    created_at: string
}

export function DepartmentsTab({ departments }: { departments: Department[] }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        const formData = new FormData(event.currentTarget)
        const res = await createDepartment(formData)
        setLoading(false)
        if (res.error) {
            alert(res.error)
        } else {
            setOpen(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Seguro que quieres eliminar este departamento?')) return
        const res = await deleteDepartment(id)
        if (res.error) alert(res.error)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Gestión de Departamentos</h2>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>Añadir Departamento</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nuevo Departamento</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 pt-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input id="name" name="name" required placeholder="Ej: Marketing" />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Guardando...' : 'Crear'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {departments.map((dept) => (
                            <TableRow key={dept.id}>
                                <TableCell className="font-medium">{dept.name}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(dept.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {departments.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                                    No hay departamentos creados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

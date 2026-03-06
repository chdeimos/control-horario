import { getGlobalUsers } from "./actions"
import { UsersTable } from "./users-table"
import { Users } from "lucide-react"

export const metadata = {
    title: 'Gestión de Usuarios | Admin Control Horario',
}

export default async function UsersPage() {
    const { data: users, error } = await getGlobalUsers()

    if (error) {
        return (
            <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg border border-red-200">
                <h2 className="text-xl font-bold">Error al cargar usuarios</h2>
                <p>{error}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                        <Users className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
                        <p className="text-slate-500 text-sm">Administra todos los usuarios registrados en la plataforma.</p>
                    </div>
                </div>
            </div>

            <UsersTable initialUsers={users || []} />
        </div>
    )
}

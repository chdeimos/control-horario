"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Clock, AlertTriangle, Palmtree, User, LogOut } from "lucide-react";
import { LogoutButton } from "@/components/features/logout-button";

interface GestionBottomNavProps {
    role: string;
}

export function GestionBottomNav({ role }: GestionBottomNavProps) {
    const pathname = usePathname();
    const isAdmin = ['company_admin', 'manager', 'super_admin'].includes(role);

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#0f172a] border-t border-white/5 flex items-center justify-around px-2 md:hidden z-[100]">
            <Link
                href="/gestion"
                className={`flex flex-col items-center gap-1 group py-2 flex-1 ${pathname === '/gestion' ? '' : 'opacity-40'}`}
            >
                <LayoutGrid size={22} className={`${pathname === '/gestion' ? 'text-[#3b60c1] drop-shadow-[0_0_8px_rgba(59,93,193,0.5)]' : 'text-white'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${pathname === '/gestion' ? 'text-[#3b60c1]' : 'text-white'}`}>Inicio</span>
            </Link>

            <Link
                href="/gestion/registros"
                className={`flex flex-col items-center gap-1 group py-2 flex-1 ${pathname === '/gestion/registros' ? '' : 'opacity-40'}`}
            >
                <Clock size={22} className={`${pathname === '/gestion/registros' ? 'text-[#3b60c1] drop-shadow-[0_0_8px_rgba(59,96,193,0.5)]' : 'text-white'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${pathname === '/gestion/registros' ? 'text-[#3b60c1]' : 'text-white'}`}>Registros</span>
            </Link>

            {isAdmin && (
                <Link
                    href="/gestion/incidencias"
                    className={`flex flex-col items-center gap-1 group py-2 flex-1 ${pathname === '/gestion/incidencias' ? '' : 'opacity-40'}`}
                >
                    <AlertTriangle size={22} className={`${pathname === '/gestion/incidencias' ? 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'text-white'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${pathname === '/gestion/incidencias' ? 'text-amber-500' : 'text-white'}`}>Alertas</span>
                </Link>
            )}

            <Link
                href="/gestion/dias-libres"
                className={`flex flex-col items-center gap-1 group py-2 flex-1 ${pathname === '/gestion/dias-libres' ? '' : 'opacity-40'}`}
            >
                <Palmtree size={22} className={`${pathname === '/gestion/dias-libres' ? 'text-[#3b60c1] drop-shadow-[0_0_8px_rgba(59,96,193,0.5)]' : 'text-white'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${pathname === '/gestion/dias-libres' ? 'text-[#3b60c1]' : 'text-white'}`}>Días</span>
            </Link>

            <div className="flex flex-col items-center flex-1 opacity-40">
                <LogoutButton variant="ghost" className="flex flex-col items-center gap-1 p-0 h-auto hover:bg-transparent active:bg-transparent">
                    <User size={22} className="text-white" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Perfil</span>
                </LogoutButton>
            </div>
        </nav>
    );
}

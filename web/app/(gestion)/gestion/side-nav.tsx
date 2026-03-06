"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Clock,
    AlertTriangle,
    Palmtree,
    PieChart,
    Users,
    User,
    Settings,
    LayoutDashboard
} from "lucide-react";

interface GestionSideNavProps {
    role: string;
    departmentId?: string | null;
}

export function GestionSideNav({ role, departmentId }: GestionSideNavProps) {
    const pathname = usePathname();
    const isAdmin = ['company_admin', 'manager', 'super_admin'].includes(role);

    const navItems = [
        {
            label: "Administración",
            items: [

                {
                    href: "/gestion/registros",
                    label: "Registro Jornada",
                    icon: Clock,
                    show: true
                },
                {
                    href: "/gestion/incidencias",
                    label: "Incidencias",
                    icon: AlertTriangle,
                    show: isAdmin,
                    variant: 'warning'
                },
                {
                    href: "/gestion/dias-libres",
                    label: "Ausencias",
                    icon: Palmtree,
                    show: true
                },
                {
                    href: "/gestion/informes",
                    label: "Informes",
                    icon: PieChart,
                    show: true
                },
                {
                    href: "/gestion/empleados",
                    label: "Empleados",
                    icon: Users,
                    show: ['company_admin', 'manager'].includes(role)
                }
            ]
        },
        {
            label: "Personal",
            items: [
                {
                    href: "/gestion/perfil",
                    label: "Mi Perfil",
                    icon: User,
                    show: true
                },
                {
                    href: "/gestion/configuracion",
                    label: "Configuración",
                    icon: Settings,
                    show: role === 'company_admin'
                }
            ]
        }
    ];

    return (
        <nav className="flex-1 px-4 space-y-8 mt-6 overflow-y-auto pb-8">
            {navItems.map((section) => (
                <div key={section.label} className="space-y-1">

                    {section.items.filter(item => item.show).map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        const isWarning = item.variant === 'warning';

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-4 px-6 py-4 rounded-lg transition-all group ${isActive
                                    ? "bg-blue-50 text-[#3b60c1]"
                                    : isWarning
                                        ? "text-amber-500 hover:bg-amber-50/50"
                                        : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                                    }`}
                            >
                                <Icon
                                    size={22}
                                    className={`transition-transform ${isActive
                                        ? "text-[#3b60c1]"
                                        : isWarning
                                            ? "text-amber-500 group-hover:scale-110"
                                            : "group-hover:scale-110"
                                        }`}
                                />
                                <span
                                    className={`font-bold text-sm tracking-tight ${isActive
                                        ? "text-[#3b60c1]"
                                        : isWarning
                                            ? "text-amber-600 group-hover:text-amber-700"
                                            : "text-slate-500 group-hover:text-slate-900"
                                        }`}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            ))}
        </nav>
    );
}

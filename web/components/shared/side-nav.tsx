"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clock, Calendar } from "lucide-react";

export function SideNav() {
    const pathname = usePathname();

    return (
        <nav className="flex-1 px-4 space-y-1 mt-6">
            <Link
                href="/fichaje"
                className={`flex items-center gap-4 px-6 py-4 rounded-lg transition-all group ${pathname === "/fichaje"
                        ? "bg-blue-50 text-[#3b60c1]"
                        : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                    }`}
            >
                <Home
                    size={22}
                    className={`transition-transform ${pathname === "/fichaje" ? "text-[#3b60c1]" : "group-hover:scale-110"
                        }`}
                />
                <span
                    className={`font-bold text-sm tracking-tight ${pathname === "/fichaje"
                            ? "text-[#3b60c1]"
                            : "text-slate-500 group-hover:text-slate-900"
                        }`}
                >
                    Inicio
                </span>
            </Link>
            <Link
                href="/fichaje/time-entries"
                className={`flex items-center gap-4 px-6 py-4 rounded-lg transition-all group ${pathname === "/fichaje/time-entries"
                        ? "bg-blue-50 text-[#3b60c1]"
                        : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                    }`}
            >
                <Clock
                    size={22}
                    className={`transition-transform ${pathname === "/fichaje/time-entries"
                            ? "text-[#3b60c1]"
                            : "group-hover:scale-110"
                        }`}
                />
                <span
                    className={`font-bold text-sm tracking-tight ${pathname === "/fichaje/time-entries"
                            ? "text-[#3b60c1]"
                            : "text-slate-500 group-hover:text-slate-900"
                        }`}
                >
                    Mis Fichajes
                </span>
            </Link>
            <Link
                href="/fichaje/dias-libres"
                className={`flex items-center gap-4 px-6 py-4 rounded-lg transition-all group ${pathname === "/fichaje/dias-libres"
                        ? "bg-blue-50 text-[#3b60c1]"
                        : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                    }`}
            >
                <Calendar
                    size={22}
                    className={`transition-transform ${pathname === "/fichaje/dias-libres"
                            ? "text-[#3b60c1]"
                            : "group-hover:scale-110"
                        }`}
                />
                <span
                    className={`font-bold text-sm tracking-tight ${pathname === "/fichaje/dias-libres"
                            ? "text-[#3b60c1]"
                            : "text-slate-500 group-hover:text-slate-900"
                        }`}
                >
                    Días Libres
                </span>
            </Link>
        </nav>
    );
}

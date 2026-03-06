'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarLinkProps {
    href: string
    icon: React.ReactNode
    label: string
}

export function SidebarLink({ href, icon, label }: SidebarLinkProps) {
    const pathname = usePathname()
    const isActive = pathname === href || (href !== '/d105' && pathname?.startsWith(href))

    return (
        <Link
            href={href}
            className={cn(
                "group flex items-center justify-between px-4 py-3.5 transition-all rounded-lg",
                isActive
                    ? "bg-[#3b60c1]/10 text-white border border-[#3b60c1]/20 shadow-lg shadow-[#3b60c1]/5"
                    : "text-white/40 hover:text-white hover:bg-white/5"
            )}
        >
            <div className="flex items-center gap-3">
                <span className={cn(
                    "transition-colors",
                    isActive ? "text-[#3b60c1]" : "group-hover:text-[#3b60c1]"
                )}>
                    {icon}
                </span>
                <span className="text-[11px] font-black uppercase tracking-widest leading-none">{label}</span>
            </div>
            <ChevronRight
                size={14}
                className={cn(
                    "transition-all text-[#3b60c1]",
                    isActive ? "opacity-100 translate-x-0" : "opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
                )}
            />
        </Link>
    )
}

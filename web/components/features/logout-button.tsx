'use client'

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { signOut } from "@/app/auth/actions"

export function LogoutButton({
    variant = "ghost",
    className = "",
    hideText = false,
    children
}: {
    variant?: "ghost" | "outline" | "default",
    className?: string,
    hideText?: boolean,
    children?: React.ReactNode
}) {
    return (
        <Button
            variant={variant}
            className={className}
            onClick={() => signOut()}
            title="Cerrar Sesión"
        >
            {children ? children : (
                <>
                    <LogOut className={hideText ? "h-6 w-6" : "mr-2 h-4 w-4"} />
                    {!hideText && "Cerrar Sesión"}
                </>
            )}
        </Button>
    )
}

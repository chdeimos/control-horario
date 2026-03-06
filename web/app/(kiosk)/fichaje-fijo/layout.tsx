import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function KioskLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className={`${inter.className} min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30 overflow-hidden`}>
            <main className="h-screen w-full">
                {children}
            </main>
        </div>
    )
}

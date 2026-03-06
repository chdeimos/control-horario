export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex flex-col md:items-center md:justify-center bg-slate-50 relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>

            {/* Content Container */}
            <div className="relative z-10 w-full md:max-w-[440px] flex-1 md:flex-none flex flex-col justify-center">
                <div className="flex-1 md:flex-none px-6 py-12 md:px-0 md:py-0">

                    {children}
                </div>
            </div>

            {/* Sticky Footer for Mobile (Optional info) */}
            <div className="md:hidden p-8 text-center mt-auto">
                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                    &copy; 2026 ControlPro System • v2.4.0
                </p>
            </div>
        </div>
    )
}

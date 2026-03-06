'use client'

import { Button } from '@/components/ui/button'
import { FileDown, Sparkles } from 'lucide-react'
import { generateBillingPDF } from '@/lib/pdf-generator'

export function ExportPDFButton({ data, month, year }: { data: any[], month: number, year: number }) {
    return (
        <Button
            variant="ghost"
            onClick={() => generateBillingPDF(data, month, year)}
            disabled={!data || data.length === 0}
            className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl h-14 px-8 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-white hover:text-[#3b60c1] hover:-translate-y-1 active:scale-95 gap-3 shadow-xl shadow-blue-900/20 group"
        >
            <FileDown size={18} className="group-hover:bounce transition-all" />
            <span>Generar Reporte Consolidado</span>
            <div className="absolute top-0 right-0 p-1 opacity-40 group-hover:opacity-100 transition-opacity">
                <Sparkles size={10} className="text-blue-200" />
            </div>
        </Button>
    )
}

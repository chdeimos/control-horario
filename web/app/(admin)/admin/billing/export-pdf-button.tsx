'use client'

import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import { generateBillingPDF } from '@/lib/pdf-generator'

export function ExportPDFButton({ data, month, year }: { data: any[], month: number, year: number }) {
    return (
        <Button
            variant="outline"
            onClick={() => generateBillingPDF(data, month, year)}
            disabled={!data || data.length === 0}
            className="border-slate-200 hover:bg-slate-50"
        >
            <FileDown className="mr-2 h-4 w-4" />
            Exportar PDF
        </Button>
    )
}

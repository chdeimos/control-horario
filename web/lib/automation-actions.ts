import { createAdminClient } from './supabase/admin'
import { generatePDF } from './pdf-generator'
import { sendEmailNotification } from './email'
import JSZip from 'jszip'
import { format, subMonths } from 'date-fns'

export async function processMonthlyReports(manualTarget?: { month: number, year: number }) {
    const supabase = createAdminClient()

    // Calculate last month if not provided
    const now = new Date()
    const lastMonthDate = subMonths(now, 1)
    const month = manualTarget?.month || lastMonthDate.getMonth() + 1
    const year = manualTarget?.year || lastMonthDate.getFullYear()

    console.log(`[AUTOMATION] Starting monthly reports for ${month}/${year}`)

    // 1. Get all companies with email
    const { data: companies, error: compError } = await supabase
        .from('companies')
        .select('id, name, cif, email')
        .not('email', 'is', null)

    if (compError) throw compError

    for (const company of companies) {
        try {
            console.log(`[AUTOMATION] Processing company: ${company.name}`)

            // 2. Get all active employees for the company
            const { data: employees, error: empError } = await supabase
                .from('profiles')
                .select('id, full_name, nif')
                .eq('company_id', company.id)
                .eq('status', 'active')

            if (empError) throw empError
            if (!employees || employees.length === 0) continue

            const zip = new JSZip()
            const folderName = `Informes_${year}_${month}`
            const folder = zip.folder(folderName)

            let pdfCount = 0

            for (const employee of employees) {
                // Get Time Entries for the month
                const startDate = new Date(year, month - 1, 1).toISOString()
                const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

                const { data: entries, error: entriesError } = await supabase
                    .from('time_entries')
                    .select('*')
                    .eq('user_id', employee.id)
                    .gte('clock_in', startDate)
                    .lte('clock_in', endDate)
                    .order('clock_in', { ascending: true })

                if (entriesError) {
                    console.error(`[AUTOMATION] Error getting entries for ${employee.full_name}: ${entriesError.message}`)
                    continue
                }

                if (!entries || entries.length === 0) continue

                // Generate PDF
                const doc = generatePDF(company, employee, entries, month, year)
                const pdfArrayBuffer = doc.output('arraybuffer')

                const filename = `Registro_${employee.full_name.replace(/[^a-z0-9]/gi, '_')}_${month}_${year}.pdf`
                folder?.file(filename, pdfArrayBuffer)
                pdfCount++
            }

            if (pdfCount > 0) {
                console.log(`[AUTOMATION] Sending ${pdfCount} reports to ${company.email}`)

                // Finalize ZIP
                const zipContent = await zip.generateAsync({ type: 'nodebuffer' })

                // Send Email
                await sendEmailNotification(
                    company.email!,
                    `Informes de Jornada Mensuales - ${month}/${year}`,
                    `<p>Hola,</p>
                     <p>Adjunto encontrarás los informes de jornada de todos tus empleados correspondientes al mes de <b>${month}/${year}</b>.</p>
                     <p>Este es un envío automático del sistema de Control Horario.</p>`,
                    [{
                        filename: `${folderName}.zip`,
                        content: zipContent
                    }]
                )
            } else {
                console.log(`[AUTOMATION] No entries found for any employee in ${company.name}`)
            }

        } catch (err: any) {
            console.error(`[AUTOMATION] Critical error for company ${company.name}:`, err.message)
        }
    }

    console.log(`[AUTOMATION] Finished all companies.`)
    return { success: true }
}

import { createAdminClient } from './supabase/admin'
import { generatePDF } from './pdf-generator'
import { sendTemplatedEmail } from './send-custom-email'
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

    // Get Platform Settings
    const { data: rawSettings } = await supabase
        .from('system_settings')
        .select('*')

    const platformSettings = (rawSettings || []).reduce((acc: any, item: any) => {
        acc[item.key] = item.value
        return acc
    }, {})

    // Fetch Logo as base64 if exists (for server-side PDF generation)
    if (platformSettings.saas_logo_pdf) {
        try {
            const response = await fetch(platformSettings.saas_logo_pdf)
            const arrayBuffer = await response.arrayBuffer()
            const base64 = Buffer.from(arrayBuffer).toString('base64')
            const mimeType = platformSettings.saas_logo_pdf.split('.').pop() === 'png' ? 'image/png' : 'image/jpeg'
            platformSettings.saas_logo_pdf = `data:${mimeType};base64,${base64}`
        } catch (e) {
            console.error("[AUTOMATION] Error fetching logo for PDF:", e)
        }
    }

    const stats = { companiesProcessed: 0, reportsGenerated: 0, emailsSent: 0, logs: [] as string[] }

    for (const company of companies) {
        try {
            stats.companiesProcessed++
            console.log(`[AUTOMATION] Processing company: ${company.name} (${company.email})`)
            stats.logs.push(`Compañía: ${company.name}`)

            // 2. Get all active employees for the company
            const { data: employees, error: empError } = await supabase
                .from('profiles')
                .select('id, full_name, nif, schedule_type, scheduled_hours')
                .eq('company_id', company.id)
                .eq('status', 'active')

            if (empError) throw empError
            if (!employees || employees.length === 0) {
                stats.logs.push(`- Sin empleados activos.`)
                continue
            }

            const startDate = new Date(year, month - 1, 1).toISOString()
            const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

            // Pre-fetch all schedules and time off for the company to be efficient
            const { data: allSchedules } = await supabase
                .from('work_schedules')
                .select('*')
                .in('profile_id', employees.map(e => e.id))
                .eq('is_active', true)

            const { data: allTimeOff } = await supabase
                .from('time_off_requests')
                .select('*')
                .in('user_id', employees.map(e => e.id))
                .eq('status', 'approved')
                .lte('start_date', endDate.split('T')[0])
                .gte('end_date', startDate.split('T')[0])

            const zip = new JSZip()
            const folderName = `Informes_${year}_${month}`
            const folder = zip.folder(folderName)

            let pdfCount = 0

            for (const employee of employees) {
                const { data: entries, error: entriesError } = await supabase
                    .from('time_entries')
                    .select('*')
                    .eq('user_id', employee.id)
                    .gte('clock_in', startDate)
                    .lte('clock_in', endDate)
                    .order('clock_in', { ascending: true })

                if (entriesError) {
                    console.error(`[AUTOMATION] Error en ${employee.full_name}: ${entriesError.message}`)
                    continue
                }

                if (!entries || entries.length === 0) continue

                const empSchedules = allSchedules?.filter(s => s.profile_id === employee.id) || []
                const empTimeOff = allTimeOff?.filter(t => t.user_id === employee.id) || []

                // Generate PDF with Branding
                const doc = generatePDF(company, employee, entries, month, year, platformSettings, empSchedules, empTimeOff)
                const pdfArrayBuffer = doc.output('arraybuffer')

                const filename = `Registro_${employee.full_name.replace(/[^a-z0-9]/gi, '_')}_${month}_${year}.pdf`
                folder?.file(filename, pdfArrayBuffer)
                pdfCount++
                stats.reportsGenerated++
            }

            if (pdfCount > 0) {
                console.log(`[AUTOMATION] Sending ${pdfCount} reports to ${company.email}`)
                stats.logs.push(`- Enviando ${pdfCount} informes a ${company.email}`)

                // Finalize ZIP
                const zipContent = await zip.generateAsync({ type: 'nodebuffer' })

                // Send Email
                const emailResult = await sendTemplatedEmail(
                    company.email!,
                    'monthly_report',
                    {
                        Month: String(month),
                        Year: String(year)
                    },
                    [{
                        filename: `${folderName}.zip`,
                        content: zipContent
                    }]
                )

                if (emailResult.success) {
                    stats.emailsSent++
                } else {
                    stats.logs.push(`- ERROR enviando email: ${JSON.stringify(emailResult.error)}`)
                }
            } else {
                console.log(`[AUTOMATION] No entries found for any employee in ${company.name}`)
                stats.logs.push(`- Sin registros para este mes.`)
            }

        } catch (err: any) {
            console.error(`[AUTOMATION] Critical error for company ${company.name}:`, err.message)
            stats.logs.push(`- ERROR CRÍTICO: ${err.message}`)
        }
    }

    console.log(`[AUTOMATION] Finished. Stats:`, stats)
    return { success: true, stats }
}

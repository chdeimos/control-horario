import { getKioskDevice, getKioskSettings } from '../actions'
import { KioskUI } from '../kiosk-ui'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function KioskPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params

    const [deviceRes, settings] = await Promise.all([
        getKioskDevice(token),
        getKioskSettings()
    ])

    if (deviceRes.error || !deviceRes.data) {
        return notFound()
    }

    const device = deviceRes.data
    const company = device.companies

    return (
        <KioskUI
            token={token}
            company={company}
            settings={settings}
        />
    )
}

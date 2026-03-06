import type { Metadata } from "next";
import { Manrope, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SWRegistration } from "@/components/pwa/sw-registration";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await supabase.from('system_settings').select('key, value')

  const settings = (data || []).reduce((acc: any, item: any) => {
    acc[item.key] = item.value
    return acc
  }, {})

  const appName = settings.app_name || 'Control Horario'
  const favicon = settings.saas_favicon

  return {
    title: {
      template: `%s | ${appName}`,
      default: appName,
    },
    description: "Sistema avanzado de control horario y gestión de RRHH",
    icons: favicon ? {
      icon: favicon,
      apple: favicon,
    } : undefined,
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: appName,
    },
    formatDetection: {
      telephone: false,
    },
  }
}

export const viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${robotoMono.variable} antialiased font-manrope`}
        suppressHydrationWarning
      >
        {children}
        <SWRegistration />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}

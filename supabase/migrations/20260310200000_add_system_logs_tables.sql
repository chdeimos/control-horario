-- Migración para el Sistema de Logs del Superadministrador

-- 1. Logs de Acceso Generales
CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    email TEXT,
    success BOOLEAN NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Logs de Acceso al Superadministrador (Detallados)
CREATE TABLE IF NOT EXISTS public.admin_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT,
    password_attempted TEXT, -- Para auditoría de fuerza bruta o errores de escritura
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Logs de Ejecución de Cron
CREATE TABLE IF NOT EXISTS public.cron_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cron_name TEXT NOT NULL, -- e.g., 'monthly_reports', 'daily_notifications'
    status TEXT NOT NULL,    -- 'success', 'error', 'partial'
    result_summary TEXT,     -- Resumen breve del resultado (e.g., "Enviados 25 emails")
    error_detail TEXT,       -- Detalle técnico en caso de error
    duration_ms INTEGER,     -- Duración de la ejecución
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Logs de Envíos de Email
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    template_name TEXT,
    status TEXT NOT NULL,    -- 'sent', 'error'
    error_message TEXT,
    provider_response JSONB, -- Respuesta cruda del proveedor para depuración
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Solo Super Admin)
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_full_access" ON public.access_logs FOR ALL USING (is_super_admin());
CREATE POLICY "superadmin_full_access" ON public.admin_access_logs FOR ALL USING (is_super_admin());
CREATE POLICY "superadmin_full_access" ON public.cron_logs FOR ALL USING (is_super_admin());
CREATE POLICY "superadmin_full_access" ON public.email_logs FOR ALL USING (is_super_admin());

-- Índices para mejorar la velocidad de consulta en el panel de logs
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON public.access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_created_at ON public.admin_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_logs_cron_name ON public.cron_logs(cron_name);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient);

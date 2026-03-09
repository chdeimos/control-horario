-- Enable the required extensions in the extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Schedule the Missing Clock Notification Check
-- Frequency: Every 15 minutes
-- We call the Next.js API route that handles the logic.
-- NOTE: For local development, we use host.docker.internal to reach the host machine from the Supabase container.
-- NOTE: Update 'tXZfKN4ej4AFTcGP9JMIFFVkp4rpkTjS76c7BXfW7iwm8SqTIli2Idb5EpOL9Kok' with your CRON_SECRET if it changes.

SELECT cron.schedule(
  'check-missing-clocks-job',
  '*/15 * * * *',
  $$
  SELECT
    http_get(
      'http://host.docker.internal:3000/api/cron/notifications?key=tXZfKN4ej4AFTcGP9JMIFFVkp4rpkTjS76c7BXfW7iwm8SqTIli2Idb5EpOL9Kok'
    )
  $$
);

-- Note: In a production environment, you should replace 'http://host.docker.internal:3000' 
-- with your actual public application URL.

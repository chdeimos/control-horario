-- Enable the required extensions in the extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Schedule the Monthly Reports Generation & Email
-- Frequency: First day of every month at 02:00 AM
-- Note: Replace 'http://host.docker.internal:3000' with your public domain in production.
-- The secret is the one defined in your .env.local

SELECT cron.schedule(
  'generate-monthly-reports-job',
  '0 2 1 * *',
  $$
  SELECT
    http_get(
      'http://host.docker.internal:3000/api/cron/monthly-reports?secret=tXZfKN4ej4AFTcGP9JMIFFVkp4rpkTjS76c7BXfW7iwm8SqTIli2Idb5EpOL9Kok'
    )
  $$
);

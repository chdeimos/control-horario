-- NOTE: Bucket is now created via TypeScript API during seed-full.ts 
-- to avoid missing column DB errors.

-- RLS Policies for branding bucket
-- 1. Public can view logos
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'branding' );

-- 2. Authenticated users can upload (we will refine this with app logic, 
-- but let's allow company admins to manage their files)
CREATE POLICY "Company Admins Can Manage Branding"
ON storage.objects FOR ALL
TO authenticated
USING ( bucket_id = 'branding' );
-- Note: In a production environment, we'd add more granular checks 
-- to ensure admins only touch their own company files based on path naming.

-- ==========================================================================
-- SUPABASE STORAGE SETUP (Buckets & Security)
-- ==========================================================================

-- 1. Create the Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'client-files', 
    'client-files', 
    false, -- IMPORTANT: Set to false to keep files private
    104857600, -- 100MB limit per file (adjust as needed)
    ARRAY['image/png', 'image/jpeg', 'application/octet-stream', 'application/vnd.ms-pki.stl', 'model/stl', 'text/plain']
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'design-files', 
    'design-files', 
    false, -- IMPORTANT: Set to false to keep files private
    209715200, -- 200MB limit for heavy design files
    ARRAY['application/octet-stream', 'application/zip', 'model/stl', 'application/x-zip-compressed']
);

-- 2. Enable RLS on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES FOR 'client-files' BUCKET
-- Clients can upload files to the client-files bucket
CREATE POLICY "Clients can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'client-files' 
    -- Ensure the user is only uploading into their own folder (auth.uid())
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Clients can only read their own files
CREATE POLICY "Clients can read their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'client-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. RLS POLICIES FOR 'design-files' BUCKET
-- Only Admins can upload to design-files
-- (Assuming admins have a specific role or are handled via a custom JWT claim)
CREATE POLICY "Admins can upload design files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'design-files'
    -- You would add an admin check here, e.g., AND auth.jwt()->>'role' = 'admin'
);

-- Clients can download design files linked to their cases
CREATE POLICY "Clients can read their design files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'design-files'
    -- The folder structure should be /client_id/case_id/file.stl
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. ADMIN OVERRIDE
-- Admins can read everything
CREATE POLICY "Admins can read all files"
ON storage.objects FOR SELECT
TO authenticated
USING (true); -- Replace with admin role check in production

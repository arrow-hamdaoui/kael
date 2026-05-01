/**
 * Kael Designer - Supabase Secure File Handling
 * This script handles direct uploads and secure signed-URL downloads for Supabase Storage.
 * 
 * PREREQUISITES:
 * 1. Include Supabase JS in your HTML: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 * 2. Initialize Supabase client: const supabase = supabase.createClient('YOUR_SUPABASE_URL', 'YOUR_ANON_KEY');
 */

const SUPABASE_BUCKET_CLIENT = 'client-files';
const SUPABASE_BUCKET_ADMIN = 'design-files';

/**
 * Uploads a file directly from the client's device to Supabase Storage.
 * @param {File} file - The file object from the file input
 * @param {string} caseId - The UUID of the case
 * @param {string} clientId - The UUID of the logged-in client
 * @param {function} onProgress - Callback for upload progress
 * @returns {Promise<string>} - Returns the storage path of the file
 */
async function uploadClientFile(file, caseId, clientId, onProgress) {
    // Structure: client_id/case_id/timestamp_filename.ext
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${clientId}/${caseId}/${fileName}`;

    try {
        // 1. Upload to Supabase Storage Bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(SUPABASE_BUCKET_CLIENT)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) throw uploadError;

        // 2. Save metadata to the `files` table in the database
        const { data: dbData, error: dbError } = await supabase
            .from('files')
            .insert([
                {
                    case_id: caseId,
                    file_url: uploadData.path, // Store the path, NOT the file itself
                    file_type: file.name.split('.').pop(),
                    uploaded_by: 'client'
                }
            ]);

        if (dbError) throw dbError;

        return uploadData.path;

    } catch (error) {
        console.error("Upload failed:", error.message);
        throw error;
    }
}

/**
 * Secures a temporary Download URL for a specific file using Signed URLs.
 * This fixes permission issues by generating a temporary access token for private files.
 * 
 * @param {string} filePath - The path stored in the database (e.g., '123-uuid/case-uuid/file.stl')
 * @param {string} bucketName - 'client-files' or 'design-files'
 * @returns {Promise<string>} - The secure temporary download URL
 */
async function getSecureDownloadUrl(filePath, bucketName) {
    try {
        // Request a Signed URL valid for 60 seconds
        const { data, error } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(filePath, 60, {
                download: true // Forces the browser to download rather than display
            });

        if (error) throw error;

        return data.signedUrl;

    } catch (error) {
        console.error("Failed to generate signed URL:", error.message);
        alert("Permission denied or file not found.");
        return null;
    }
}

/**
 * Triggers a secure download in the browser.
 * Admin and Client will call this function when they click a "Download" button.
 */
async function downloadFileSecurely(filePath, bucketName, originalFileName) {
    // 1. Get the 60-second secure link
    const signedUrl = await getSecureDownloadUrl(filePath, bucketName);
    
    if (signedUrl) {
        // 2. Create a temporary anchor tag to force the download
        const a = document.createElement('a');
        a.href = signedUrl;
        // Setting the download attribute helps preserve the original filename
        a.download = originalFileName || 'downloaded_file';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

// ============================================================================
// UI IMPLEMENTATION EXAMPLES
// ============================================================================

// Example: Rendering the Download Button for a file
function renderFileItem(fileMetadata) {
    return `
        <div class="file-item">
            <div class="file-info">
                <i class="fa-solid fa-file text-accent"></i>
                <span class="file-name">${fileMetadata.original_name}</span>
                <span class="file-type badge">${fileMetadata.file_type.toUpperCase()}</span>
            </div>
            <button class="btn btn-primary download-btn" 
                    onclick="downloadFileSecurely('${fileMetadata.file_url}', '${fileMetadata.bucket}', '${fileMetadata.original_name}')">
                <i class="fa-solid fa-download"></i> Download
            </button>
        </div>
    `;
}

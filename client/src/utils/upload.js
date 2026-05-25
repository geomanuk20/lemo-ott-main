/**
 * Utility to upload files (images & videos) directly to Cloudinary via the backend api/upload endpoint.
 */
export const uploadToCloudinary = async (file, onProgress) => {
  if (!file) return null;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Upload failed');
    }

    const data = await response.json();
    return data.url || null;
  } catch (err) {
    console.error('[Cloudinary Upload Error]:', err);
    throw err;
  }
};

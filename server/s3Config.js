const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const path = require('path');

// Initialize the S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Uploads a local file to AWS Amazon S3 and returns the public file URL.
 * @param {string} filePath - Absolute path to the local file
 * @param {string} originalName - Original name of the uploaded file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} - Resolves to the uploaded file's S3 URL
 */
const uploadFileToS3 = async (filePath, originalName, mimeType) => {
  const bucketName = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION || 'us-east-1';

  if (!bucketName) {
    throw new Error('AWS_BUCKET_NAME is not configured in environment variables');
  }

  // Create a unique key for S3
  const fileExtension = path.extname(originalName);
  const baseName = path.basename(originalName, fileExtension).replace(/[^a-zA-Z0-9]/g, '_');
  const uniqueKey = `videos/${Date.now()}_${baseName}${fileExtension}`;

  const fileStream = fs.createReadStream(filePath);

  const uploadParams = {
    Bucket: bucketName,
    Key: uniqueKey,
    Body: fileStream,
    ContentType: mimeType,
  };

  try {
    console.log(`[S3 UPLOAD] Uploading ${originalName} to bucket ${bucketName}...`);
    await s3Client.send(new PutObjectCommand(uploadParams));
  } catch (s3Err) {
    console.error(`[S3 UPLOAD ERROR] Failed putting object:`, s3Err);
    if (s3Err.$metadata && s3Err.$metadata.headers) {
      console.error(`[S3 UPLOAD ERROR] Response Headers:`, s3Err.$metadata.headers);
    }
    throw s3Err;
  }

  // Construct and return the S3 URL
  const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${uniqueKey}`;
  console.log(`[S3 UPLOAD] Success! URL: ${s3Url}`);
  return s3Url;
};

/**
 * Uploads a local raw file to AWS Amazon S3 input directory and returns the s3:// URI.
 * @param {string} filePath - Absolute path to the local file
 * @param {string} originalName - Original name of the uploaded file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} - Resolves to the uploaded file's s3:// URI
 */
const uploadInputToS3 = async (filePath, originalName, mimeType) => {
  const bucketName = process.env.AWS_BUCKET_NAME;

  if (!bucketName) {
    throw new Error('AWS_BUCKET_NAME is not configured in environment variables');
  }

  // Create a unique key for S3 inputs
  const fileExtension = path.extname(originalName);
  const baseName = path.basename(originalName, fileExtension).replace(/[^a-zA-Z0-9]/g, '_');
  const uniqueKey = `inputs/${Date.now()}_${baseName}${fileExtension}`;

  const fileStream = fs.createReadStream(filePath);

  const uploadParams = {
    Bucket: bucketName,
    Key: uniqueKey,
    Body: fileStream,
    ContentType: mimeType,
  };

  try {
    console.log(`[S3 INPUT UPLOAD] Uploading ${originalName} to bucket ${bucketName} (key: ${uniqueKey})...`);
    await s3Client.send(new PutObjectCommand(uploadParams));
  } catch (s3Err) {
    console.error(`[S3 INPUT UPLOAD ERROR] Failed putting object:`, s3Err);
    throw s3Err;
  }

  // Construct and return the S3 URI (s3://bucket-name/key)
  const s3Uri = `s3://${bucketName}/${uniqueKey}`;
  console.log(`[S3 INPUT UPLOAD] Success! URI: ${s3Uri}`);
  return s3Uri;
};


/**
 * Checks if a URL is an S3 URL and returns a temporary pre-signed URL if so.
 * If not an S3 URL, returns the original URL as-is.
 * @param {string} url - The URL to check and potentially sign
 * @param {number} [expiresIn=120] - Expiration time in seconds (default 2 minutes)
 * @returns {Promise<string>}
 */
const getPresignedUrlIfS3 = async (url, expiresIn = 120) => {
  if (!url || typeof url !== 'string') return url;

  // Bypass pre-signing for HLS playlists since segments are fetched relatively
  if (url.includes('.m3u8')) return url;

  const bucketName = process.env.AWS_BUCKET_NAME;
  if (!bucketName) return url;

  // Pattern: https://<bucket>.s3.<region>.amazonaws.com/<key>
  // Or: https://s3.<region>.amazonaws.com/<bucket>/<key>
  const s3MatchPattern = new RegExp(`https://(?:${bucketName}\\.s3\\.[a-z0-9-]+\\.amazonaws\\.com|s3\\.[a-z0-9-]+\\.amazonaws\\.com/${bucketName})/(.+)`);
  const match = url.match(s3MatchPattern);

  if (!match) return url;

  try {
    const key = decodeURIComponent(match[1]);
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    // Generate pre-signed URL
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return presignedUrl;
  } catch (err) {
    console.error(`[S3 PRESIGN ERROR] Failed to generate presigned URL for ${url}:`, err.message);
    return url;
  }
};

/**
 * Uploads an HLS directory (index.m3u8 and ts segments) to AWS S3.
 * @param {string} hlsDir - Path to the local HLS folder
 * @param {string} folderName - S3 folder name (e.g. hls_1780126512197)
 * @returns {Promise<string>} - Resolves to the S3 URL of the index.m3u8 file
 */
const uploadHlsToS3 = async (hlsDir, folderName) => {
  const bucketName = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION || 'us-east-1';

  if (!bucketName) {
    throw new Error('AWS_BUCKET_NAME is not configured in environment variables');
  }

  const files = fs.readdirSync(hlsDir);
  let playlistUrl = '';

  for (const file of files) {
    const filePath = path.join(hlsDir, file);
    const uniqueKey = `videos/${folderName}/${file}`;
    const fileStream = fs.createReadStream(filePath);
    
    let mimeType = 'video/MP2T'; // default for .ts segments
    if (file.endsWith('.m3u8')) {
      mimeType = 'application/x-mpegURL';
    }

    const uploadParams = {
      Bucket: bucketName,
      Key: uniqueKey,
      Body: fileStream,
      ContentType: mimeType,
    };

    console.log(`[S3 HLS UPLOAD] Uploading ${file} to S3 (${uniqueKey})...`);
    await s3Client.send(new PutObjectCommand(uploadParams));

    if (file.endsWith('.m3u8')) {
      playlistUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${uniqueKey}`;
    }
  }

  return playlistUrl;
};

/**
 * Retrieves a file stream from AWS S3.
 * @param {string} key - S3 object key
 * @returns {Promise<{ stream: any, contentType: string, contentLength: number }>}
 */
const getS3FileStream = async (key) => {
  const bucketName = process.env.AWS_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('AWS_BUCKET_NAME is not configured in environment variables');
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await s3Client.send(command);
  return {
    stream: response.Body,
    contentType: response.ContentType,
    contentLength: response.ContentLength,
  };
};

module.exports = { s3Client, uploadFileToS3, uploadInputToS3, getPresignedUrlIfS3, uploadHlsToS3, getS3FileStream };

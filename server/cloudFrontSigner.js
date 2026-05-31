const { getSignedUrl } = require('@aws-sdk/cloudfront-signer');

/**
 * Normalizes and converts an S3 URL into a CloudFront CDN URL if applicable.
 * @param {string} url - S3 URL or other video URL
 * @returns {string} - CloudFront URL
 */
const getCloudFrontUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  const domain = process.env.AWS_CLOUDFRONT_DOMAIN;
  const bucketName = process.env.AWS_BUCKET_NAME;

  if (!domain || !bucketName) return url;

  // Pattern: https://<bucket>.s3.<region>.amazonaws.com/<key>
  // Or: https://s3.<region>.amazonaws.com/<bucket>/<key>
  const s3MatchPattern = new RegExp(`https://(?:${bucketName}\\.s3\\.[a-z0-9-]+\\.amazonaws\\.com|s3\\.[a-z0-9-]+\\.amazonaws\\.com/${bucketName})/(.+)`);
  const match = url.match(s3MatchPattern);

  if (match) {
    const key = match[1];
    let formattedDomain = domain.trim();
    if (!formattedDomain.startsWith('http://') && !formattedDomain.startsWith('https://')) {
      formattedDomain = `https://${formattedDomain}`;
    }
    return `${formattedDomain}/${key}`;
  }

  return url;
};

/**
 * Generates a signed CloudFront URL for secure private content delivery.
 * @param {string} url - Permanent video URL (S3 or CloudFront)
 * @param {number} [expirationSeconds=7200] - Expiration time in seconds (default 2 hours)
 * @returns {string} - Signed CloudFront URL
 */
const signCloudFrontUrl = (url, expirationSeconds = 7200) => {
  const domain = process.env.AWS_CLOUDFRONT_DOMAIN;
  const keyPairId = process.env.AWS_CLOUDFRONT_KEY_PAIR_ID;
  const privateKeyRaw = process.env.AWS_CLOUDFRONT_PRIVATE_KEY;

  if (!domain || !keyPairId || !privateKeyRaw) {
    // If not fully configured, return the normalized CloudFront URL without signature
    return getCloudFrontUrl(url);
  }

  try {
    const cdnUrl = getCloudFrontUrl(url);
    let privateKey = privateKeyRaw.trim();

    // Decode base64 if PEM tags are missing (convenient for environment variables)
    if (!privateKey.startsWith('-----BEGIN')) {
      privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
    }
    privateKey = privateKey.replace(/:/g, '\n').replace(/\\n/g, '\n').replace(/"/g, '').trim();

    const dateLessThan = new Date(Date.now() + expirationSeconds * 1000).toISOString();

    const signedUrl = getSignedUrl({
      url: cdnUrl,
      keyPairId,
      privateKey,
      dateLessThan,
    });

    return signedUrl;
  } catch (err) {
    console.error('[CLOUDFRONT SIGNER ERROR] Failed to sign URL:', err.message);
    return getCloudFrontUrl(url);
  }
};

module.exports = { signCloudFrontUrl, getCloudFrontUrl };

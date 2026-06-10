const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5001;

// Dynamic URL discovery for emails and payment gateways
const getClientUrl = (req) => {
  if (process.env.CLIENT_URL) {
    return process.env.CLIENT_URL;
  }
  const host = (req && (req.headers['x-forwarded-host'] || req.get('host'))) || '';
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return 'http://localhost:5173';
  }
  const isHttps = req && (req.secure || req.headers['x-forwarded-proto'] === 'https');
  return `${isHttps ? 'https' : 'http'}://${host}`;
};

const getServerUrl = (req) => {
  if (process.env.SERVER_URL) {
    return process.env.SERVER_URL;
  }
  const host = (req && (req.headers['x-forwarded-host'] || req.get('host'))) || '';
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return 'http://localhost:5001';
  }
  const isHttps = req && (req.secure || req.headers['x-forwarded-proto'] === 'https');
  return `${isHttps ? 'https' : 'http'}://${host}`;
};

const getPhonePeCredentials = (gw) => {
  const hasDbSettings = !!gw?.settings?.merchantId;
  const isSandbox = hasDbSettings 
    ? (gw?.settings?.isSandbox !== false)
    : (process.env.PHONEPE_ENV || 'SANDBOX').toUpperCase() !== 'PRODUCTION';

  let merchantId;
  let saltKey;
  let saltIndex;

  if (hasDbSettings) {
    // Database settings mapping:
    // - Client Id (merchantId) -> settings.merchantId
    // - API Key (publishableKey) -> settings.publishableKey (contains the salt key)
    // - Client Version (secretKey) -> settings.secretKey (contains the salt index/client version)
    merchantId = gw.settings.merchantId;
    saltKey = gw.settings.publishableKey;
    saltIndex = parseInt(gw.settings.secretKey || '1');
  } else {
    // Fallback to .env environment variables (supports both V2 and V1 naming)
    merchantId = process.env.PHONEPE_CLIENT_ID || process.env.PHONEPE_MERCHANT_ID;
    saltKey = process.env.PHONEPE_CLIENT_SECRET || process.env.PHONEPE_SALT_KEY;
    saltIndex = parseInt(process.env.PHONEPE_CLIENT_VERSION || process.env.PHONEPE_SALT_INDEX || '1');
  }

  if (isNaN(saltIndex)) {
    saltIndex = 1;
  }

  // Base64 decode saltKey if it's base64 encoded
  if (saltKey && !saltKey.includes('-')) {
    try {
      const decoded = Buffer.from(saltKey, 'base64').toString('utf8');
      if (decoded.includes('-')) {
        saltKey = decoded;
      }
    } catch (e) {
      // ignore
    }
  }

  // Handle case where saltKey includes index suffix (e.g. key###1)
  if (saltKey && saltKey.includes('###')) {
    const parts = saltKey.split('###');
    saltKey = parts[0];
    if (parts[1]) {
      saltIndex = parseInt(parts[1]);
    }
  }

  // Auto-fallback to standard PhonePe Sandbox credentials in test mode
  // to ensure test transactions always succeed, regardless of production keys entered.
  if (isSandbox) {
    merchantId = 'PGTESTPAYUAT';
    saltKey = '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
    saltIndex = 1;
  }

  return { merchantId, saltKey, saltIndex, isSandbox };
};


const getPhonePeClient = (merchantId, saltKey, saltIndex, env) => {
  // Clear require cache for the PhonePe SDK to bypass client re-initialization restrictions
  Object.keys(require.cache).forEach((key) => {
    if (key.includes('@phonepe-pg/pg-sdk-node')) {
      delete require.cache[key];
    }
  });

  const { StandardCheckoutClient } = require('@phonepe-pg/pg-sdk-node');
  return StandardCheckoutClient.getInstance(merchantId, saltKey, saltIndex, env);
};

// Enable Mongoose buffering with a reasonable timeout
mongoose.set('bufferCommands', true);
mongoose.set('bufferTimeoutMS', 15000);

const JWT_SECRET = process.env.JWT_SECRET || 'video_ott_secret_key_2026';

// Dynamic SMTP Transporter Discovery Engine
const getTransporter = async () => {
  try {
    const dbSettings = await SMTPSettings.findOne();
    
    // If DB settings exist and are not placeholders, use them
    if (dbSettings && dbSettings.host !== 'Hidden in Demo') {
      const normalizedPass = dbSettings.password.replace(/\s/g, '');
      console.log(`Using Database SMTP Settings. Pass starts with: ${normalizedPass.substring(0, 3)}...`);
      return nodemailer.createTransport({
        host: dbSettings.host,
        port: dbSettings.port,
        secure: dbSettings.encryption === 'SSL' || dbSettings.port == 465,
        auth: {
          user: dbSettings.email,
          pass: normalizedPass,
        },
        authMethod: 'LOGIN',
        tls: {
          rejectUnauthorized: false
        },
        logger: true,
        debug: true,
      });
    }

    // Fallback to .env Discovery
    const envPass = process.env.SMTP_PASS.replace(/\s/g, '');
    console.log(`Using Environment SMTP Settings. Pass starts with: ${envPass.substring(0, 3)}...`);
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: envPass,
      },
      authMethod: 'LOGIN',
      tls: {
        rejectUnauthorized: false
      },
      logger: true,
      debug: true,
    });
  } catch (err) {
    console.error('Transporter Discovery Anomaly:', err);
    throw err;
  }
};

const Stats = require('./models/Stats');
const User = require('./models/User');
const Language = require('./models/Language');
const Genre = require('./models/Genre');
const Movie = require('./models/Movie');
const NewRelease = require('./models/NewRelease');
const Show = require('./models/Show');
const Season = require('./models/Season');
const Episode = require('./models/Episode');
const SubscriptionPlan = require('./models/SubscriptionPlan');
const Coupon = require('./models/Coupon');
const Transaction = require('./models/Transaction');
const PaymentGateway = require('./models/PaymentGateway');
const Page = require('./models/Page');
const PlayerSettings = require('./models/PlayerSettings');
const PlayerAds = require('./models/PlayerAds');
const GeneralSettings = require('./models/GeneralSettings');
const SMTPSettings = require('./models/SMTPSettings');
const SocialLoginSettings = require('./models/SocialLoginSettings');
const TVChannel = require('./models/TVChannel');
const Slider = require('./models/Slider');
const HomeSection = require('./models/HomeSection');
const Actor = require('./models/Actor');
const Director = require('./models/Director');
const SportsCategory = require('./models/SportsCategory');
const SportsVideo = require('./models/SportsVideo');
const TVCategory = require('./models/TVCategory');
const Asset = require('./models/Asset');
const Experience = require('./models/Experience');
const Rating = require('./models/Rating');
const Submission = require('./models/Submission');

const isAdminRequest = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    return user && ['admin', 'sub-admin'].includes(user.role);
  } catch (_) {
    return false;
  }
};

const reCaptchaSettingsSchema = new mongoose.Schema({
  siteKey: { type: String, default: 'Hidden in Demo' },
  secretKey: { type: String, default: 'Hidden in Demo' },
  login: { type: String, default: 'OFF' },
  signup: { type: String, default: 'OFF' },
  forgotPassword: { type: String, default: 'OFF' },
  contactUs: { type: String, default: 'ON' }
});
const ReCaptchaSettings = mongoose.model('ReCaptchaSettings', reCaptchaSettingsSchema);

const bannerAdsSchema = new mongoose.Schema({
  homeTop: { type: String, default: '' },
  homeBottom: { type: String, default: '' },
  listTop: { type: String, default: '' },
  listBottom: { type: String, default: '' },
  detailsTop: { type: String, default: '' },
  detailsBottom: { type: String, default: '' },
  otherPagesTop: { type: String, default: '' },
  otherPagesBottom: { type: String, default: '' }
});
const BannerAds = mongoose.model('BannerAds', bannerAdsSchema);

const maintenanceSettingsSchema = new mongoose.Schema({
  status: { type: Boolean, default: false },
  title: { type: String, default: 'The Website Under Maintenance!' },
  description: { type: String, default: 'This Website Under Maintenance!' },
  secret: { type: String, default: 'viaviweb' },
  endTime: { type: String, default: '' }
});
const MaintenanceSettings = mongoose.model('MaintenanceSettings', maintenanceSettingsSchema);

const appVerifySettingsSchema = new mongoose.Schema({
  purchaseCode: { type: String, default: '' },
  buyerName: { type: String, default: '' },
  appPackageName: { type: String, default: '' }
});
const AppVerifySettings = mongoose.model('AppVerifySettings', appVerifySettingsSchema);

const androidAppSettingsSchema = new mongoose.Schema({
  appName: { type: String, default: 'Video OTT' },
  appLogo: { type: String, default: '' },
  appEmail: { type: String, default: 'admin@video.com' },
  appAuthor: { type: String, default: 'Video' },
  appContact: { type: String, default: '' },
  appWebsite: { type: String, default: '' },
  appDescription: { type: String, default: '' },
  appVersion: { type: String, default: '1.0.0' },
  appUpdateStatus: { type: String, default: 'OFF' },
  appUpdateMsg: { type: String, default: '' },
  appUpdateUrl: { type: String, default: '' },
  appCancelBtn: { type: String, default: 'OFF' }
});
const AndroidAppSettings = mongoose.model('AndroidAppSettings', androidAppSettingsSchema);

const appAdSettingsSchema = new mongoose.Schema({
  adStatus: { type: String, default: 'OFF' },
  adType: { type: String, default: 'Admob' },
  admobPublisherId: { type: String, default: '' },
  admobBannerAdId: { type: String, default: '' },
  admobInterstitialAdId: { type: String, default: '' },
  admobNativeAdId: { type: String, default: '' },
  admobRewardAdId: { type: String, default: '' },
  facebookBannerAdId: { type: String, default: '' },
  facebookInterstitialAdId: { type: String, default: '' },
  facebookNativeAdId: { type: String, default: '' }
});
const AppAdSettings = mongoose.model('AppAdSettings', appAdSettingsSchema);

const appNotificationSettingsSchema = new mongoose.Schema({
  onesignalAppId: { type: String, default: '' },
  onesignalRestApiKey: { type: String, default: '' }
});
const AppNotificationSettings = mongoose.model('AppNotificationSettings', appNotificationSettingsSchema);

const menuSettingsSchema = new mongoose.Schema({
  shows: { type: String, default: 'ON' },
  movies: { type: String, default: 'ON' },
  sports: { type: String, default: 'ON' },
  liveTv: { type: String, default: 'ON' },
  shortFilms: { type: String, default: 'ON' },
  webSeries: { type: String, default: 'ON' }
});
const MenuSettings = mongoose.model('MenuSettings', menuSettingsSchema);
// jwt already declared at top
const { cloudinary, upload } = require('./cloudinaryConfig');
const { uploadFileToS3, uploadInputToS3, getPresignedUrlIfS3, uploadHlsToS3, getS3FileStream } = require('./s3Config');
const { transcodeToHls } = require('./hlsTranscoder');
const { uploadToMux, getPlaybackPolicyCached, signPlaybackId } = require('./muxService');
const { createMediaConvertHlsJob } = require('./mediaConvert');
const { signCloudFrontUrl, getCloudFrontUrl } = require('./cloudFrontSigner');


const getProxiedHlsUrlIfS3 = (url, req) => {
  if (!url || typeof url !== 'string' || !url.includes('.m3u8')) return url;

  const bucketName = process.env.AWS_BUCKET_NAME;
  if (!bucketName) return url;

  const match = url.match(/\/videos\/(hls_\d+\/index\.m3u8)/);
  if (!match) return url;

  const serverUrl = getServerUrl(req);
  
  // Extract token from request headers or query to secure the stream automatically
  let tokenParam = '';
  const authHeader = req?.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    tokenParam = `?token=${token}`;
  } else if (req?.query?.token) {
    tokenParam = `?token=${req.query.token}`;
  }

  return `${serverUrl}/api/videos/${match[1]}${tokenParam}`;
};

const signVideoDocument = async (doc, req) => {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;

  try {
    const ratingCount = await Rating.countDocuments({ contentId: obj._id });
    obj.ratingsCount = ratingCount;
  } catch (err) {
    console.error('Error counting ratings for document:', err);
  }

  const fields = ['videoFile', 'videoFile480', 'videoFile720', 'videoFile1080', 'trailerUrl', 'downloadUrl'];
  for (const field of fields) {
    if (obj[field]) {
      if (obj[field].includes('.m3u8')) {
        obj[field] = getProxiedHlsUrlIfS3(obj[field], req);
      } else {
        if (process.env.AWS_CLOUDFRONT_DOMAIN && process.env.AWS_CLOUDFRONT_KEY_PAIR_ID && process.env.AWS_CLOUDFRONT_PRIVATE_KEY) {
          obj[field] = signCloudFrontUrl(obj[field]);
        } else {
          obj[field] = await getPresignedUrlIfS3(obj[field]);
        }
      }
    }
  }
  return obj;
};

const signVideoDocuments = async (docs, req) => {
  if (!docs) return docs;
  if (Array.isArray(docs)) {
    return Promise.all(docs.map(doc => signVideoDocument(doc, req)));
  }
  return signVideoDocument(docs, req);
};

const multer = require('multer');
const fs = require('fs');

// Ensure tmp upload directory exists
const tmpDir = path.join(__dirname, 'uploads', 'tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Multer Disk Storage for temporary file parsing
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tmpDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});
const localUpload = multer({ storage: diskStorage });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static('uploads'));
app.use('/upload', express.static('uploads')); // Alias for legacy support

// YouTube Live HLS Stream Extractor Endpoint
app.get('/api/youtube/live-m3u8', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ message: 'URL query parameter is required' });
  }

  try {
    const axios = require('axios');

    // Extract 11-character YouTube video ID
    const ytReg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|embed|live)\/|watch\?v=)|youtu\.be\/)([^"&?\/ ]{11})/;
    const ytMatch = url.match(ytReg);
    if (!ytMatch || !ytMatch[1]) {
      return res.status(400).json({ message: 'Could not extract valid YouTube video ID from URL' });
    }
    const videoId = ytMatch[1];

    // Try embed page first (lightweight, bypasses cookie consent screens completely)
    // Try watch page second as fallback
    const urlsToTry = [
      `https://www.youtube.com/embed/${videoId}`,
      `https://www.youtube.com/watch?v=${videoId}`
    ];

    let extractedUrl = null;

    for (const urlToFetch of urlsToTry) {
      try {
        console.log(`[YouTube Live Extractor] Fetching: ${urlToFetch}`);
        const response = await axios.get(urlToFetch, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.youtube.com/',
          },
          timeout: 8000
        });

        const html = response.data;

        // 1. Look for hlsManifestUrl key in JSON/JavaScript block
        const hlsMatch = html.match(/"hlsManifestUrl"\s*:\s*"([^"]+)"/);
        if (hlsMatch && hlsMatch[1]) {
          extractedUrl = hlsMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
          console.log(`[YouTube Live Extractor] Extracted via hlsManifestUrl key from ${urlToFetch}`);
          break;
        }

        // 2. Look for hlsManifestUrl key with different escaping
        const hlsMatchEscaped = html.match(/hlsManifestUrl\\"\s*:\s*\\"(https:[^\"]+)\\"/);
        if (hlsMatchEscaped && hlsMatchEscaped[1]) {
          extractedUrl = hlsMatchEscaped[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
          console.log(`[YouTube Live Extractor] Extracted via escaped hlsManifestUrl key from ${urlToFetch}`);
          break;
        }

        // 3. Look for generic manifest/hls_live URL pattern
        const fallbackMatch = html.match(/https?:\\\/\\\/[^"'\s]+manifest\\\/hls_live[^"'\s]+/);
        if (fallbackMatch) {
          extractedUrl = fallbackMatch[0].replace(/\\u0026/g, '&').replace(/\\/g, '');
          console.log(`[YouTube Live Extractor] Extracted via generic hls_live pattern from ${urlToFetch}`);
          break;
        }

        const fallbackMatchRaw = html.match(/https?:\/\/[^"'\s]+manifest\/hls_live[^"'\s]+/);
        if (fallbackMatchRaw) {
          extractedUrl = fallbackMatchRaw[0].replace(/\\u0026/g, '&').replace(/\\/g, '');
          console.log(`[YouTube Live Extractor] Extracted via raw hls_live pattern from ${urlToFetch}`);
          break;
        }
      } catch (err) {
        console.error(`[YouTube Live Extractor] Failed to extract from ${urlToFetch}:`, err.message);
      }
    }

    if (extractedUrl) {
      return res.json({ m3u8Url: extractedUrl });
    }

    return res.status(404).json({ message: 'No live HLS stream found for this YouTube URL' });
  } catch (error) {
    console.error('Error resolving YouTube HLS stream:', error.message);
    return res.status(500).json({ message: 'Failed to resolve YouTube HLS stream', error: error.message });
  }
});

// Upload Route - handles local disk staging, then S3 (videos) or Cloudinary (images) upload
app.post('/api/upload', localUpload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname || '';
  const mimeType = req.file.mimetype || '';
  const isVideo = mimeType.startsWith('video/') || !!originalName.match(/\.(mp4|mkv|webm|avi|mov)$/i);

  try {
    let fileUrl = '';

    if (isVideo) {
      if (!process.env.AWS_MEDIACONVERT_ENDPOINT || !process.env.AWS_MEDIACONVERT_ROLE_ARN) {
        throw new Error('AWS MediaConvert settings (endpoint and/or role ARN) are not configured in environment variables.');
      }

      console.log(`[UPLOAD] Video detected: ${originalName}. Uploading raw file to S3...`);
      // 1. Upload raw video to S3 inputs folder
      const inputS3Url = await uploadInputToS3(filePath, originalName, mimeType);

      // 2. Generate unique HLS output folder and name
      const timestamp = Date.now();
      const bucketName = process.env.AWS_BUCKET_NAME;
      const region = process.env.AWS_REGION || 'ap-south-1';
      
      const outputS3Folder = `s3://${bucketName}/videos/hls_${timestamp}/index`;

      // 3. Trigger AWS MediaConvert job
      await createMediaConvertHlsJob(inputS3Url, outputS3Folder);

      // 4. Construct S3 playlist URL and convert to CloudFront CDN URL
      const s3PlaylistUrl = `https://${bucketName}.s3.${region}.amazonaws.com/videos/hls_${timestamp}/index.m3u8`;
      fileUrl = getCloudFrontUrl(s3PlaylistUrl);

      console.log(`[UPLOAD] MediaConvert job triggered successfully. Permanent playback URL: ${fileUrl}`);
    } else {
      console.log(`[UPLOAD] Image/Asset detected: ${originalName}. Uploading to Cloudinary...`);
      // Upload image to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        folder: 'video_ott_uploads',
        resource_type: 'image',
      });
      fileUrl = uploadResult.secure_url;
    }

    // Clean up temporary local file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ url: fileUrl });
  } catch (err) {
    console.error('[UPLOAD ERROR]:', err);
    // Clean up temporary local file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(500).json({ message: err.message || 'File upload failed' });
  }
});

// Assets API
app.get('/api/assets', async (req, res) => {
  try {
    const assets = await Asset.find().sort({ createdAt: -1 });
    res.json(assets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/assets', async (req, res) => {
  try {
    const asset = new Asset(req.body);
    const newAsset = await asset.save();
    res.status(201).json(newAsset);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/assets/:id', async (req, res) => {
  try {
    await Asset.findByIdAndDelete(req.params.id);
    res.json({ message: 'Asset deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Experiences API
app.get('/api/experiences', async (req, res) => {
  try {
    const exps = await Experience.find().sort({ order: 1 });
    res.json(exps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/experiences', async (req, res) => {
  try {
    const exp = new Experience(req.body);
    const newExp = await exp.save();
    res.status(201).json(newExp);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/experiences/:id', async (req, res) => {
  try {
    const updatedExp = await Experience.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(updatedExp);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/experiences/:id', async (req, res) => {
  try {
    await Experience.findByIdAndDelete(req.params.id);
    res.json({ message: 'Experience deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/test', (req, res) => res.send('Server is alive'));

// Helper to record and enforce active session limits
async function recordActiveSession(user, token, deviceId) {
  const isStaff = ['admin', 'sub-admin'].includes(user.role);
  if (isStaff) return;

  // 1. Look up device limit
  let deviceLimit = 1; // safe default
  try {
    const plan = await SubscriptionPlan.findOne({ planName: user.subscriptionPlan });
    if (plan && plan.deviceLimit) {
      const parsed = parseInt(plan.deviceLimit.toString().replace(/[^\d]/g, ''));
      if (!isNaN(parsed) && parsed > 0) deviceLimit = parsed;
    }
  } catch (_) {}

  // Helper to resolve login time from session, checking iat field in JWT if loginAt is missing
  const getSessionTime = (s) => {
    if (s.loginAt) return new Date(s.loginAt).getTime();
    if (s.token) {
      try {
        const decoded = jwt.decode(s.token);
        if (decoded && decoded.iat) return decoded.iat * 1000;
      } catch (_) {}
    }
    return Date.now();
  };

  user.activeSessions = user.activeSessions || [];

  // 2. Prune sessions older than 30 days for Device A (index 0) and 12 hours for subsequent sessions
  const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  user.activeSessions = user.activeSessions.filter((s, idx) => {
    if (idx === 0) {
      return getSessionTime(s) > thirtyDaysAgo; // Device A (index 0) expires in 30 days
    }
    return getSessionTime(s) > twelveHoursAgo; // Other devices expire in 12 hours
  });

  // 3. Manage device sessions
  const incomingDeviceId = deviceId || 'unknown';
  const existingIndex = user.activeSessions.findIndex(s => s.deviceId === incomingDeviceId);
  if (existingIndex !== -1) {
    // Same device re-logging in — update its token and timestamp in-place (keeping its index)
    user.activeSessions[existingIndex].token = token;
    user.activeSessions[existingIndex].loginAt = new Date();
  } else {
    // New device logging in
    if (user.activeSessions.length >= deviceLimit) {
      if (deviceLimit === 1) {
        // Limit is 1, replace the only session
        user.activeSessions = [];
      } else {
        // Limit >= 2, we protect Device A (index 0) and remove from secondary sessions (index >= 1)
        const numToRemove = user.activeSessions.length - deviceLimit + 1;
        // Splice starting at index 1 to preserve Device A at index 0
        user.activeSessions.splice(1, numToRemove);
      }
    }
    // Record the new session
    user.activeSessions.push({ token, deviceId: incomingDeviceId, loginAt: new Date() });
  }

  // 5. Update device history
  user.deviceHistory = user.deviceHistory || [];
  user.deviceHistory.push({
    deviceId: incomingDeviceId,
    status: 'Success',
    loginAt: new Date()
  });
  if (user.deviceHistory.length > 20) {
    user.deviceHistory = user.deviceHistory.slice(-20);
  }
}

// Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Enforce email domain checks for login
    const isAdminDomain = normalizedEmail.endsWith('@video.com') || normalizedEmail === 'admin@video.com';
    const isGmailDomain = normalizedEmail.endsWith('@gmail.com');

    if (!isAdminDomain && !isGmailDomain) {
      return res.status(400).json({ message: 'Only @gmail.com email addresses are allowed for users, and admin@video.com for admin login.' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if ((user.status || 'Active') !== 'Active') {
      return res.status(403).json({ message: 'User account is inactive/suspended' });
    }

    // If logging in with admin format, ensure the user is actually an admin/sub-admin
    if (isAdminDomain && user.role !== 'admin' && user.role !== 'sub-admin') {
      return res.status(403).json({ message: 'Access denied. This format is reserved for admin login.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Ensure Basic Plan is active if no plan exists
    if (!user.subscriptionPlan || user.subscriptionPlan === '' || !user.expiryDate || user.expiryDate === '') {
      user.subscriptionPlan = 'Basic Plan';
      user.expiryDate = '2099-12-31';
    }

    // Auto-promote the main user to Admin to prevent lockout
    if (user.email === 'geomanuk20@gmail.com' && user.role !== 'admin') {
      user.role = 'admin';
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    await recordActiveSession(user, token, deviceId);
    await user.save();

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        status: user.status,
        subscriptionPlan: user.subscriptionPlan,
        expiryDate: user.expiryDate
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Logout Route — removes the session token from active sessions
app.post('/api/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(200).json({ message: 'Logged out' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (_) {
      return res.status(200).json({ message: 'Logged out' });
    }
    const user = await User.findById(decoded.id);
    if (user) {
      user.activeSessions = (user.activeSessions || []).filter(s => s.token !== token);
      await user.save();
    }
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(200).json({ message: 'Logged out' });
  }
});

// Validate Session / Token Route
app.get('/api/auth/validate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token is required' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (_) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    if ((user.status || 'Active') !== 'Active') {
      return res.status(401).json({ message: 'User account is suspended' });
    }
    const isStaff = ['admin', 'sub-admin'].includes(user.role);
    if (!isStaff) {
      const sessionExists = (user.activeSessions || []).some(s => s.token === token);
      if (!sessionExists) {
        return res.status(401).json({ message: 'Session has been invalidated or logged out' });
      }
    }
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        status: user.status,
        subscriptionPlan: user.subscriptionPlan,
        expiryDate: user.expiryDate
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Register Route
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, deviceId } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Enforce email domain checks for registration
    if (normalizedEmail.endsWith('@video.com') || normalizedEmail === 'admin@video.com') {
      return res.status(400).json({ message: 'Registration is not permitted for admin email accounts.' });
    }

    if (!normalizedEmail.endsWith('@gmail.com')) {
      return res.status(400).json({ message: 'Only @gmail.com email addresses are permitted for registration.' });
    }

    console.log('Registering user:', normalizedEmail);
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      name,
      email: normalizedEmail,
      password,
      role: 'customer' // Default discovery role for frontend registration
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    await recordActiveSession(user, token, deviceId);
    await user.save();

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        status: user.status,
        subscriptionPlan: user.subscriptionPlan,
        expiryDate: user.expiryDate
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Google Login / Auth Route
app.post('/api/auth/google', async (req, res) => {
  try {
    const { token, deviceId } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const settings = await SocialLoginSettings.findOne();
    if (!settings || settings.googleLogin?.toUpperCase() === 'OFF') {
      return res.status(400).json({ message: 'Google login is currently disabled' });
    }

    // Verify access token via Google userinfo API
    const response = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
    const payload = response.data;

    const email = payload.email.trim().toLowerCase();
    
    // Enforce email domain checks for social login (Gmail only for customers, admin can use admin@video.com or @video.com)
    const isAdminDomain = email.endsWith('@video.com') || email === 'admin@video.com';
    const isGmailDomain = email.endsWith('@gmail.com');
    if (!isAdminDomain && !isGmailDomain) {
      return res.status(400).json({ message: 'Only @gmail.com email addresses are permitted.' });
    }

    const name = payload.name;
    const profileImage = payload.picture;

    let user = await User.findOne({ email });
    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      user = new User({
        email,
        name: name || email.split('@')[0],
        password: randomPassword,
        authProvider: 'Google',
        role: 'customer',
        profileImage: profileImage || '',
        status: 'Active',
        subscriptionPlan: 'Basic Plan',
        expiryDate: '2099-12-31'
      });
      await user.save();
    } else {
      if ((user.status || 'Active') !== 'Active') {
        return res.status(403).json({ message: 'User account is inactive/suspended' });
      }
      let updated = false;
      if (!user.profileImage && profileImage) {
        user.profileImage = profileImage;
        updated = true;
      }
      if (!user.name && name) {
        user.name = name;
        updated = true;
      }
      if (user.authProvider !== 'Google') {
        user.authProvider = 'Google';
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    if (!user.subscriptionPlan || user.subscriptionPlan === '' || !user.expiryDate || user.expiryDate === '') {
      user.subscriptionPlan = 'Basic Plan';
      user.expiryDate = '2099-12-31';
      await user.save();
    }

    const jwtToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    await recordActiveSession(user, jwtToken, deviceId);
    await user.save();

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        status: user.status,
        subscriptionPlan: user.subscriptionPlan,
        expiryDate: user.expiryDate
      }
    });
  } catch (err) {
    console.error('Google Auth Error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Google authentication failed' });
  }
});

// Dedicated Mobile Social Login Endpoint (Google/Facebook bypass for testing/simulations)
app.post('/api/auth/social-login-mobile', async (req, res) => {
  try {
    const { email, name, provider, deviceId } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const settings = await SocialLoginSettings.findOne();
    const providerLower = (provider || 'google').toLowerCase();
    if (providerLower === 'google' && settings?.googleLogin?.toUpperCase() === 'OFF') {
      return res.status(400).json({ message: 'Google login is currently disabled by admin' });
    }
    if (providerLower === 'facebook' && settings?.facebookLogin?.toUpperCase() === 'OFF') {
      return res.status(400).json({ message: 'Facebook login is currently disabled by admin' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    
    // Enforce email domain checks for mobile social login
    const isAdminDomain = normalizedEmail.endsWith('@video.com') || normalizedEmail === 'admin@video.com';
    const isGmailDomain = normalizedEmail.endsWith('@gmail.com');
    if (!isAdminDomain && !isGmailDomain) {
      return res.status(400).json({ message: 'Only @gmail.com email addresses are permitted.' });
    }

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const crypto = require('crypto');
      const randomPassword = crypto.randomBytes(16).toString('hex');
      user = new User({
        email: normalizedEmail,
        name: name || normalizedEmail.split('@')[0],
        password: randomPassword,
        authProvider: provider || 'Google',
        role: 'customer',
        status: 'Active',
        subscriptionPlan: 'Basic Plan',
        expiryDate: '2099-12-31'
      });
      await user.save();
    } else {
      if ((user.status || 'Active') !== 'Active') {
        return res.status(403).json({ message: 'User account is inactive/suspended' });
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    await recordActiveSession(user, token, deviceId);
    await user.save();

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        status: user.status,
        subscriptionPlan: user.subscriptionPlan,
        expiryDate: user.expiryDate
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Facebook Login / Auth Route
app.post('/api/auth/facebook', async (req, res) => {
  try {
    const { token, deviceId } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const settings = await SocialLoginSettings.findOne();
    if (!settings || settings.facebookLogin?.toUpperCase() === 'OFF') {
      return res.status(400).json({ message: 'Facebook login is currently disabled' });
    }

    // Verify access token via Facebook Graph API
    const response = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${token}`);
    const payload = response.data;

    if (!payload.email) {
      return res.status(400).json({ message: 'Facebook account must have an associated email address' });
    }

    const email = payload.email.trim().toLowerCase();
    
    // Enforce email domain checks for Facebook social login
    const isAdminDomain = email.endsWith('@video.com') || email === 'admin@video.com';
    const isGmailDomain = email.endsWith('@gmail.com');
    if (!isAdminDomain && !isGmailDomain) {
      return res.status(400).json({ message: 'Only @gmail.com email addresses are permitted.' });
    }

    const name = payload.name;
    const profileImage = payload.picture?.data?.url;

    let user = await User.findOne({ email });
    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      user = new User({
        email,
        name: name || email.split('@')[0],
        password: randomPassword,
        authProvider: 'Facebook',
        role: 'customer',
        profileImage: profileImage || '',
        status: 'Active',
        subscriptionPlan: 'Basic Plan',
        expiryDate: '2099-12-31'
      });
      await user.save();
    } else {
      if ((user.status || 'Active') !== 'Active') {
        return res.status(403).json({ message: 'User account is inactive/suspended' });
      }
      let updated = false;
      if (!user.profileImage && profileImage) {
        user.profileImage = profileImage;
        updated = true;
      }
      if (!user.name && name) {
        user.name = name;
        updated = true;
      }
      if (user.authProvider !== 'Facebook') {
        user.authProvider = 'Facebook';
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    if (!user.subscriptionPlan || user.subscriptionPlan === '' || !user.expiryDate || user.expiryDate === '') {
      user.subscriptionPlan = 'Basic Plan';
      user.expiryDate = '2099-12-31';
      await user.save();
    }

    const jwtToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    await recordActiveSession(user, jwtToken, deviceId);
    await user.save();

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        status: user.status,
        subscriptionPlan: user.subscriptionPlan,
        expiryDate: user.expiryDate
      }
    });
  } catch (err) {
    console.error('Facebook Auth Error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Facebook authentication failed' });
  }
});

// Forgot Password Route
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    console.log('Searching for user to reset:', normalizedEmail);
    
    // Enforce email domain checks for password reset
    const isAdminDomain = normalizedEmail.endsWith('@video.com') || normalizedEmail === 'admin@video.com';
    const isGmailDomain = normalizedEmail.endsWith('@gmail.com');
    if (!isAdminDomain && !isGmailDomain) {
      return res.status(400).json({ message: 'Only @gmail.com email addresses are permitted.' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    console.log('User found:', user ? 'YES' : 'NO');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate Discovery Reset Token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour discovery duration
    await user.save();

    // Get Dynamic Transporter
    const dynamicTransporter = await getTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Video OTT Platform <noreply@video.com>',
      to: normalizedEmail,
      subject: 'Password Reset Request - Video OTT Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #050505; color: #fff; padding: 40px; border-radius: 20px;">
          <h2 style="color: #ff0000; text-align: center;">Password Reset</h2>
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your password for your Video OTT account.</p>
          <p>If you made this request, please click the button below to reset your password. This link will expire in 1 hour.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${getClientUrl(req)}/reset-password?token=${resetToken}" style="background: #ff0000; color: #fff; text-decoration: none; padding: 15px 30px; border-radius: 30px; font-weight: bold; display: inline-block;">RESET PASSWORD</a>
          </div>
          <p>If you did not request a password reset, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #222; margin: 30px 0;" />
          <p style="font-size: 0.8rem; color: #666; text-align: center;">© 2026 Video OTT Platform. All rights reserved.</p>
        </div>
      `,
    };

    await dynamicTransporter.sendMail(mailOptions);
    res.json({ message: 'Password reset link sent to your email' });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ message: 'Error sending email. Please check SMTP settings.' });
  }
});

// --- Watchlist Orchestration Discovery ---
app.get('/api/watchlist/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Populate content details from respective collections
    const watchlistDetails = await Promise.all(user.watchlist.map(async (item) => {
      let detail = null;
      if (item.contentType === 'movie') {
        detail = await Movie.findById(item.contentId);
        if (!detail) detail = await NewRelease.findById(item.contentId);
      }
      else if (item.contentType === 'new-releases') {
        detail = await NewRelease.findById(item.contentId);
        if (!detail) detail = await Movie.findById(item.contentId);
      }
      else if (item.contentType === 'show') detail = await Show.findById(item.contentId);
      else if (item.contentType === 'sports') detail = await SportsVideo.findById(item.contentId);
      else if (item.contentType === 'live') detail = await TVChannel.findById(item.contentId);
      
      if (detail) {
        return { 
          ...detail.toObject(), 
          dbContentType: detail.contentType, // Preserve original contentType
          contentType: item.contentType 
        };
      }
      return null;
    }));

    let filteredDetails = watchlistDetails.filter(d => d !== null);

    const menuSettings = await MenuSettings.findOne().lean();
    if (menuSettings) {
      const moviesOff = menuSettings.movies?.toUpperCase() === 'OFF';
      const shortFilmsOff = menuSettings.shortFilms?.toUpperCase() === 'OFF';
      const showsOff = menuSettings.shows?.toUpperCase() === 'OFF';
      const webSeriesOff = menuSettings.webSeries?.toUpperCase() === 'OFF';
      const sportsOff = menuSettings.sports?.toUpperCase() === 'OFF';
      const liveTvOff = menuSettings.liveTv?.toUpperCase() === 'OFF';

      filteredDetails = filteredDetails.filter(item => {
        if (item.contentType === 'movie') {
          const isShortFilm = item.dbContentType === 'Short Film' || item.dbContentType === 'short-film';
          if (isShortFilm && shortFilmsOff) return false;
          if (!isShortFilm && moviesOff) return false;
        }
        if (item.contentType === 'new-releases') {
          if (moviesOff) return false;
        }
        if (item.contentType === 'show') {
          const isShortWeb = item.dbContentType === 'Short Web Series' || item.dbContentType === 'Short Web-Series' || item.dbContentType === 'web-series';
          if (isShortWeb && webSeriesOff) return false;
          if (!isShortWeb && showsOff) return false;
        }
        if (item.contentType === 'sports' && sportsOff) return false;
        if (item.contentType === 'live' && liveTvOff) return false;
        return true;
      });
    }

    res.json(filteredDetails);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/watchlist/toggle', async (req, res) => {
  try {
    const { userId, contentId, contentType } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const index = user.watchlist.findIndex(i => i.contentId.toString() === contentId);
    if (index === -1) {
      user.watchlist.push({ contentId, contentType });
      await user.save();
      res.json({ message: 'Added to watchlist', status: 'added' });
    } else {
      user.watchlist.splice(index, 1);
      await user.save();
      res.json({ message: 'Removed from watchlist', status: 'removed' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Ratings API ---
// Submit or update a user rating
app.post('/api/ratings', async (req, res) => {
  try {
    const { userId, contentId, contentType, rating } = req.body;
    if (!userId || !contentId || !contentType || !rating) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const ratingVal = parseInt(rating, 10);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }

    // Upsert the rating
    const updatedRating = await Rating.findOneAndUpdate(
      { userId, contentId },
      { contentType, rating: ratingVal },
      { new: true, upsert: true }
    );

    // Recalculate average rating for this content
    const allRatings = await Rating.find({ contentId });
    const ratingsCount = allRatings.length;
    const ratingsSum = allRatings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = ratingsCount > 0 ? (ratingsSum / ratingsCount) : 0.0;

    // Convert 5-star average rating to 10-point scale for IMDb circle display
    const formattedRating = (averageRating * 2).toFixed(1);

    // Update the rating in the content model
    let model;
    const type = contentType.toLowerCase().trim();
    if (type === 'movie' || type === 'movies' || type === 'short-film') {
      model = Movie;
    } else if (type === 'show' || type === 'shows' || type === 'series' || type === 'short-web-series') {
      model = Show;
    } else if (type === 'sports' || type === 'sport') {
      model = SportsVideo;
    } else if (type === 'live' || type === 'channel' || type === 'tv-channel') {
      model = TVChannel;
    } else if (type === 'new-release') {
      model = NewRelease;
    }

    if (model) {
      await model.findByIdAndUpdate(contentId, { imdbRating: formattedRating });
    }

    res.json({
      message: 'Rating submitted successfully',
      rating: updatedRating,
      averageRating: formattedRating,
      ratingsCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's rating for a content item
app.get('/api/ratings/status', async (req, res) => {
  try {
    const { userId, contentId } = req.query;
    if (!userId || !contentId) {
      return res.status(400).json({ message: 'Missing userId or contentId' });
    }

    const ratingDoc = await Rating.findOne({ userId, contentId });
    res.json({
      rated: !!ratingDoc,
      rating: ratingDoc ? ratingDoc.rating : 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Submissions API ---
app.post('/api/submissions', async (req, res) => {
  try {
    const submission = new Submission(req.body);
    await submission.save();
    res.status(201).json({ success: true, message: 'Submission saved successfully', data: submission });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/submissions', async (req, res) => {
  try {
    const filter = {};
    if (req.query.email) {
      filter.email = req.query.email;
    }
    const submissions = await Submission.find(filter).sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/submissions/:id', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: update review status or any field on a submission
app.patch('/api/submissions/:id', async (req, res) => {
  try {
    const updated = await Submission.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Submission not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/submissions/:id', async (req, res) => {
  try {
    await Submission.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Submission deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Bulk delete submissions
app.post('/api/submissions/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ message: 'ids array required' });
    await Submission.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${ids.length} submissions deleted` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Import submissions from JSON
app.post('/api/submissions/import', async (req, res) => {
  try {
    const { submissions } = req.body;
    if (!submissions || !Array.isArray(submissions)) return res.status(400).json({ message: 'submissions array required' });
    const inserted = await Submission.insertMany(submissions, { ordered: false });
    res.json({ success: true, message: `${inserted.length} submissions imported` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PhonePe Submissions Payment
app.post('/api/payment/phonepe/initiate-submission', async (req, res) => {
  try {
    const PaymentGateway = require('./models/PaymentGateway');
    const gw = await PaymentGateway.findOne({ name: 'PhonePe' });
    if (!gw || gw.status !== 'Active') return res.status(400).json({ message: 'PhonePe gateway is not active. Please contact admin.' });

    const { merchantId, saltKey, saltIndex, isSandbox } = getPhonePeCredentials(gw);
    console.log('[PhonePe Submission] merchantId:', merchantId, '| isSandbox:', isSandbox, '| saltKey:', saltKey ? `${saltKey.substring(0, 5)}...${saltKey.substring(saltKey.length - 5)}` : 'null', '| saltIndex:', saltIndex);

    if (!merchantId || !saltKey) {
      return res.status(400).json({ message: 'PhonePe credentials not configured. Please contact admin.' });
    }

    const transactionId = 'SUB_' + Date.now() + Math.random().toString(36).substring(2, 7).toUpperCase();

    // Create a pending Submission record BEFORE initiating payment
    const Submission = require('./models/Submission');
    const submissionData = {
      ...req.body.submissionData,
      paymentMethod: 'PhonePe',
      paymentDescription: `Pending PhonePe Payment: ${transactionId}`,
      paymentId: transactionId,
      paymentStatus: 'Pending'
    };

    const submission = new Submission(submissionData);
    await submission.save();

    const amountInPaise = 500 * 100; // Fixed: ₹500

    const { StandardCheckoutClient, Env, StandardCheckoutPayRequest, MetaInfo, PrefillUserLoginDetails } = require('@phonepe-pg/pg-sdk-node');
    const env = isSandbox ? Env.SANDBOX : Env.PRODUCTION;
    const client = getPhonePeClient(merchantId, saltKey, saltIndex, env);


    const serverUrl = getServerUrl(req);
    const redirectUrl = `${serverUrl}/api/payment/phonepe/callback-submission?txnId=${transactionId}`;

    let requestBuilder = StandardCheckoutPayRequest.builder()
      .merchantOrderId(transactionId)
      .amount(amountInPaise)
      .redirectUrl(redirectUrl);

    // Build prefill user login details if phone is available
    const submissionPhone = req.body.submissionData?.phone;
    if (submissionPhone) {
      const phoneClean = submissionPhone.replace(/\D/g, '').slice(-10);
      if (phoneClean.length === 10) {
        try {
          const prefill = PrefillUserLoginDetails.builder()
              .phoneNumber(phoneClean)
              .build();
          requestBuilder = requestBuilder.prefillUserLoginDetails(prefill);
        } catch (e) {
          console.error("Prefill details builder error:", e);
        }
      }
    }

    // Build metaInfo
    try {
      const meta = MetaInfo.builder()
          .udf1("submission")
          .udf2(req.body.submissionData?.contentName || "film")
          .udf3(req.body.submissionData?.email || "email")
          .build();
      requestBuilder = requestBuilder.metaInfo(meta);
    } catch (e) {
      console.error("MetaInfo builder error:", e);
    }

    requestBuilder = requestBuilder
        .message(`Lemo OTT Film Submission: ${req.body.submissionData?.contentName || 'Content'}`)
        .expireAfter(3600);

    const request = requestBuilder.build();

    const response = await client.pay(request);

    if (response && response.redirectUrl) {
      return res.json({ redirectUrl: response.redirectUrl });
    } else {
      // Rollback the pending submission if PhonePe didn't give a URL
      await Submission.findByIdAndDelete(submission._id);
      return res.status(400).json({ message: 'PhonePe did not return a redirect URL. Please try again.' });
    }
  } catch (error) {
    console.error('PhonePe submission init error:', error?.response?.data || error.message);
    res.status(500).json({ message: 'Payment gateway error: ' + (error.message || 'Unknown error') });
  }
});

app.all('/api/payment/phonepe/callback-submission', async (req, res) => {
  try {
    const requestData = { ...req.query, ...req.body };

    // PhonePe V2 sends ?code=PAYMENT_SUCCESS or a base64 encoded response body
    let parsedData = requestData;
    if (requestData.response) {
      try {
        const decodedResponse = Buffer.from(requestData.response, 'base64').toString('utf8');
        parsedData = JSON.parse(decodedResponse);
      } catch (e) { /* ignore decode errors */ }
    }

    const txnId = req.query.txnId
      || parsedData.data?.merchantTransactionId
      || parsedData.merchantTransactionId
      || parsedData.transactionId
      || requestData.transactionId
      || requestData.orderId;

    // PhonePe V2 redirect appends ?code=PAYMENT_SUCCESS to the redirectUrl
    let successCode = req.query.code
      || parsedData.code
      || requestData.code
      || requestData.state
      || parsedData.state;

    const Submission = require('./models/Submission');
    const submission = await Submission.findOne({ paymentId: txnId });

    if (!submission) {
      console.error(`Submission not found for txnId: ${txnId}`);
      const clientUrl = getClientUrl(req);
      return res.redirect(`${clientUrl}/submission?payment_status=error`);
    }

    // If no code from redirect, query PhonePe directly for status
    if (!successCode && txnId) {
      try {
        const PaymentGateway = require('./models/PaymentGateway');
        const gw = await PaymentGateway.findOne({ name: 'PhonePe' });
        if (gw) {
          const { merchantId, saltKey, saltIndex, isSandbox } = getPhonePeCredentials(gw);

          const { StandardCheckoutClient, Env } = require('@phonepe-pg/pg-sdk-node');
          const env = isSandbox ? Env.SANDBOX : Env.PRODUCTION;
          const client = getPhonePeClient(merchantId, saltKey, saltIndex, env);

          const statusRes = await client.getOrderStatus(txnId);
          console.log('PhonePe order status response:', JSON.stringify(statusRes));

          // V2 SDK returns { state: 'COMPLETED' | 'FAILED' | 'PENDING' }
          if (statusRes?.state === 'COMPLETED' || statusRes?.code === 'PAYMENT_SUCCESS') {
            successCode = 'PAYMENT_SUCCESS';
          } else if (statusRes?.state === 'FAILED') {
            successCode = 'PAYMENT_FAILED';
          }
        }
      } catch (e) {
        console.error('Error querying PhonePe order status:', e.message);
      }
    }

    const clientUrl = getClientUrl(req);

    if (successCode === 'PAYMENT_SUCCESS') {
      submission.paymentStatus = 'Completed';
      submission.paymentDescription = `PhonePe Payment Completed: ${txnId}`;
      await submission.save();
      return res.redirect(`${clientUrl}/submission?payment_status=success&txn=${txnId}`);
    } else {
      submission.paymentStatus = 'Failed';
      submission.paymentDescription = `PhonePe Payment Failed/Cancelled: ${txnId} (code: ${successCode || 'unknown'})`;
      await submission.save();
      return res.redirect(`${clientUrl}/submission?payment_status=failed`);
    }
  } catch (err) {
    console.error('Submission callback error:', err.message);
    const clientUrl = getClientUrl(req);
    res.redirect(`${clientUrl}/submission?payment_status=error`);
  }
});

// --- Billing & Invoice Discovery ---
app.get('/api/user/transactions/:email', async (req, res) => {
  try {
    const transactions = await Transaction.find({ email: req.params.email }).populate('planId').sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reset Password Completion Discovery
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ message: 'Missing token or password discovery data.' });
    }

    // Find User by Discovery Token
    const user = await User.findOne({ 
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() } 
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Invalid or expired discovery token.' });
    }

    // Update Password and Clear Tokens
    user.password = password;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: 'Password updated successfully discovery.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Error updating password.' });
  }
});

// Admin Seeding Function
const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@video.com' });
    if (!adminExists) {
      const admin = new User({
        email: 'admin@video.com',
        password: 'adminpassword', 
        role: 'admin'
      });
      await admin.save();
      console.log('Default admin created');
    }

    // Seed Languages if none exist
    const langCount = await Language.countDocuments();
    if (langCount === 0) {
      const defaultLangs = [
        { name: 'Arabic', status: true },
        { name: 'English', status: true },
        { name: 'French', status: true },
        { name: 'Hindi', status: true },
        { name: 'Malayalam', status: true },
        { name: 'Spanish', status: true }
      ];
      await Language.insertMany(defaultLangs);
      console.log('Default languages seeded');
    }

    // Seed Genres if none exist
    const genreCount = await Genre.countDocuments();
    if (genreCount === 0) {
      const defaultGenres = [
        { name: 'Action', status: true },
        { name: 'Comedy', status: true },
        { name: 'Drama', status: true },
        { name: 'Horror', status: true },
        { name: 'Romance', status: true },
        { name: 'Sci-Fi', status: true },
        { name: 'Thriller', status: true },
        { name: 'Animation', status: true }
      ];
      await Genre.insertMany(defaultGenres);
      console.log('Default genres seeded');
    }

    // Seed Movies if none exist
    const movieCount = await Movie.countDocuments();
    if (movieCount === 0) {
      const defaultMovies = [
        { title: 'Fast X', language: 'English', genres: ['Action'], poster: 'https://m.media-amazon.com/images/M/MV5BNzZmOTU1ZTEtYzVhNi00NzQxLWI5YjAtNWQwYWVlZmxmZjBkXkEyXkFqcGdeQXVyNjYyODY4OTM@._V1_.jpg', status: 'Active' },
        { title: 'Kantara A Legend: Chapter 1', language: 'Malayalam', genres: ['Action', 'Drama'], poster: 'https://m.media-amazon.com/images/M/MV5BNDM1YTAyMTQtNDhkNS00NGEzLWE2NzItMDgyZjk1YTIxZTA5XkEyXkFqcGdeQXVyMTUzNTgzNzM0._V1_.jpg', status: 'Active' },
        { title: 'Captain Miller', language: 'Malayalam', genres: ['Action', 'Thriller'], poster: 'https://m.media-amazon.com/images/M/MV5BMGRjYjA2M2EtZGUwNy00ZGE3LWExYTgtYmFlYmU3YmU3N2M3XkEyXkFqcGdeQXVyMTI1NDEyNTM5._V1_.jpg', status: 'Active' },
        { title: 'Kung Fu Panda 4', language: 'English', genres: ['Animation', 'Comedy'], poster: 'https://m.media-amazon.com/images/M/MV5BZDY0YzI0OTctYjVhYy00MTVhLWE0NTgtYzhmYmUyZWExZWYwXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg', status: 'Active' }
      ];
      await Movie.insertMany(defaultMovies);
      console.log('Default movies seeded');
    }
  } catch (err) {
    console.error('Error seeding data:', err.message);
  }
};

// Basic Route
app.get('/api/stats', async (req, res) => {
  try {
    const [
      moviesCount, showsCount, seasonsCount, episodesCount,
      usersCount, languagesCount, genresCount, sportsCount,
      liveTvCount, transactionsCount, allTransactions
    ] = await Promise.all([
      Movie.countDocuments().maxTimeMS(5000),
      Show.countDocuments().maxTimeMS(5000),
      Season.countDocuments().maxTimeMS(5000),
      Episode.countDocuments().maxTimeMS(5000),
      User.countDocuments().maxTimeMS(5000),
      Language.countDocuments().maxTimeMS(5000),
      Genre.countDocuments().maxTimeMS(5000),
      SportsVideo.countDocuments().maxTimeMS(5000),
      TVChannel.countDocuments().maxTimeMS(5000),
      Transaction.countDocuments().maxTimeMS(5000),
      Transaction.find({ status: 'Completed' }).lean().maxTimeMS(5000)
    ]);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const daysAgoStr = (n) => {
      const d = new Date(now);
      d.setDate(d.getDate() - n);
      return d.toISOString().split('T')[0];
    };

    const weekAgoStr = daysAgoStr(7);
    const monthAgoStr = daysAgoStr(30);
    const yearAgoStr = daysAgoStr(365);

    const parseAmount = (t) => {
      const raw = t.amount || t.price || '0';
      const val = parseFloat(raw.toString().replace(/[^\d.]/g, ''));
      return isNaN(val) ? 0 : val;
    };

    let daily = 0, weekly = 0, monthly = 0, yearly = 0, totalRevenue = 0;
    const currentYear = now.getFullYear();
    const planStats = {
      basic: Array(12).fill(0),
      premium: Array(12).fill(0),
      platinum: Array(12).fill(0),
      diamond: Array(12).fill(0)
    };

    allTransactions.forEach(t => {
      const dateStr = t.paymentDate || (t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : null);
      const amount = parseAmount(t);
      totalRevenue += amount;

      if (dateStr) {
        if (dateStr === todayStr) daily += amount;
        if (dateStr >= weekAgoStr) weekly += amount;
        if (dateStr >= monthAgoStr) monthly += amount;
        if (dateStr >= yearAgoStr) yearly += amount;

        const txYear = parseInt(dateStr.substring(0, 4));
        const txMonth = parseInt(dateStr.substring(5, 7)) - 1;
        if (txYear === currentYear && txMonth >= 0 && txMonth < 12) {
          const planLower = (t.plan || '').toLowerCase();
          if (planLower.includes('basic')) planStats.basic[txMonth]++;
          else if (planLower.includes('premium')) planStats.premium[txMonth]++;
          else if (planLower.includes('platinum')) planStats.platinum[txMonth]++;
          else if (planLower.includes('diamond')) planStats.diamond[txMonth]++;
        }
      }
    });

    res.json({
      movies: moviesCount,
      shows: showsCount,
      seasons: seasonsCount,
      episodes: episodesCount,
      users: usersCount,
      languages: languagesCount,
      genres: genresCount,
      sports: sportsCount,
      liveTv: liveTvCount,
      transactions: transactionsCount,
      revenue: {
        daily: daily.toFixed(2),
        weekly: weekly.toFixed(2),
        monthly: monthly.toFixed(2),
        yearly: yearly.toFixed(2),
        total: totalRevenue.toFixed(2)
      },
      planStats
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Error calculating statistics' });
  }
});

// Language Routes
app.get('/api/languages', async (req, res) => {
  try {
    const languages = await Language.find().sort({ name: 1 });
    res.json(languages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/languages', async (req, res) => {
  try {
    const language = new Language(req.body);
    await language.save();
    res.status(201).json(language);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/languages/:id', async (req, res) => {
  try {
    const language = await Language.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(language);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/languages/:id', async (req, res) => {
  try {
    await Language.findByIdAndDelete(req.params.id);
    res.json({ message: 'Language deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Genre Routes
app.get('/api/genres', async (req, res) => {
  try {
    const genres = await Genre.find().sort({ name: 1 });
    res.json(genres);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/genres', async (req, res) => {
  try {
    const genre = new Genre(req.body);
    await genre.save();
    res.status(201).json(genre);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/genres/:id', async (req, res) => {
  try {
    const genre = await Genre.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(genre);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/genres/:id', async (req, res) => {
  try {
    await Genre.findByIdAndDelete(req.params.id);
    res.json({ message: 'Genre deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mux Sign Token Route
app.get('/api/mux/sign-token', async (req, res) => {
  const { playbackId } = req.query;
  if (!playbackId) {
    return res.status(400).json({ message: 'playbackId query parameter is required' });
  }

  try {
    const policy = await getPlaybackPolicyCached(playbackId);
    if (policy === 'signed') {
      const token = signPlaybackId(playbackId);
      if (token) {
        return res.json({ token });
      } else {
        return res.status(500).json({ message: 'Failed to sign playback ID. Verify backend signing key configuration.' });
      }
    }
    return res.json({ token: null });
  } catch (err) {
    console.error('Error in /api/mux/sign-token:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Video Proxy and Streaming Endpoint
app.get('/api/videos/:folder/:file', async (req, res) => {
  const { folder, file } = req.params;
  const token = req.query.token;

  // 1. Authorize the request
  if (!token) {
    return res.status(401).json({ message: 'Authorization token is required to stream this video' });
  }

  try {
    jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired authorization token' });
  }

  // 2. Fetch the file from S3
  const s3Key = `videos/${folder}/${file}`;
  
  try {
    const { stream, contentType, contentLength } = await getS3FileStream(s3Key);
    
    // Set headers
    res.setHeader('Content-Type', contentType);
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    
    // For browsers to allow cross-origin media requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');

    // If it's a playlist (.m3u8), we rewrite it on the fly to append the token to all segments
    if (file.endsWith('.m3u8')) {
      const chunks = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => {
        const body = Buffer.concat(chunks);
        let playlistText = body.toString('utf-8');
        
        // Append ?token=... to all segment (.ts) and sub-playlist (.m3u8) URLs inside the playlist file
        playlistText = playlistText.replace(/([a-zA-Z0-9_-]+\.(?:ts|m3u8))/g, `$1?token=${token}`);
        
        res.send(playlistText);
      });
    } else {
      // Pipe the raw video segment (.ts) stream directly to the response
      stream.pipe(res);
    }
  } catch (err) {
    console.error(`[VIDEO PROXY ERROR] Failed fetching S3 key ${s3Key}:`, err.message);
    res.status(404).json({ message: 'Video segment not found or access denied' });
  }
});

// Movie Routes
app.get('/api/movies', async (req, res) => {
  try {
    const isAdmin = await isAdminRequest(req);
    const query = {};
    if (!isAdmin) {
      query.status = 'Active';
      const menuSettings = await MenuSettings.findOne().lean();
      if (menuSettings) {
        const moviesOff = menuSettings.movies?.toUpperCase() === 'OFF';
        const shortFilmsOff = menuSettings.shortFilms?.toUpperCase() === 'OFF';

        if (moviesOff && shortFilmsOff) {
          return res.json([]);
        } else if (moviesOff) {
          query.contentType = { $in: ['Short Film', 'short-film'] };
        } else if (shortFilmsOff) {
          query.contentType = { $nin: ['Short Film', 'short-film'] };
        }
      }
    }

    const movies = await Movie.find(query).sort({ createdAt: -1 });
    const signedMovies = await signVideoDocuments(movies, req);
    res.json(signedMovies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/movies/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id)
      .populate('actors')
      .populate('directors');
    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    const isAdmin = await isAdminRequest(req);
    if (!isAdmin) {
      const menuSettings = await MenuSettings.findOne().lean();
      if (menuSettings) {
        const isShortFilm = movie.contentType === 'Short Film' || movie.contentType === 'short-film';
        const moviesOff = menuSettings.movies?.toUpperCase() === 'OFF';
        const shortFilmsOff = menuSettings.shortFilms?.toUpperCase() === 'OFF';
        if ((isShortFilm && shortFilmsOff) || (!isShortFilm && moviesOff)) {
          return res.status(403).json({ message: 'Content is disabled' });
        }
      }
    }

    const signedMovie = await signVideoDocument(movie, req);
    res.json(signedMovie);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/movies', async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    res.status(201).json(movie);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/movies/:id', async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(movie);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/movies/:id', async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    res.json({ message: 'Movie deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// NewRelease Routes
app.get('/api/new-releases', async (req, res) => {
  try {
    const menuSettings = await MenuSettings.findOne().lean();
    if (menuSettings && menuSettings.movies?.toUpperCase() === 'OFF') {
      return res.json([]);
    }
    const newReleases = await NewRelease.find().sort({ createdAt: -1 });
    const signedNewReleases = await signVideoDocuments(newReleases, req);
    res.json(signedNewReleases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/new-releases/:id', async (req, res) => {
  try {
    const menuSettings = await MenuSettings.findOne().lean();
    if (menuSettings && menuSettings.movies?.toUpperCase() === 'OFF') {
      return res.status(403).json({ message: 'Content is disabled' });
    }
    const newRelease = await NewRelease.findById(req.params.id)
      .populate('actors')
      .populate('directors');
    if (!newRelease) return res.status(404).json({ message: 'New Release not found' });
    const signedNewRelease = await signVideoDocument(newRelease, req);
    res.json(signedNewRelease);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/new-releases', async (req, res) => {
  try {
    const newRelease = new NewRelease(req.body);
    await newRelease.save();
    res.status(201).json(newRelease);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/new-releases/:id', async (req, res) => {
  try {
    const newRelease = await NewRelease.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(newRelease);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/new-releases/:id', async (req, res) => {
  try {
    await NewRelease.findByIdAndDelete(req.params.id);
    res.json({ message: 'New Release deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/new-releases/copy-move', async (req, res) => {
  try {
    const { ids, targetSection, actionType } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No release IDs provided' });
    }
    if (!targetSection || !['Movie', 'Short Film', 'TV Show', 'Short Web Series'].includes(targetSection)) {
      return res.status(400).json({ message: 'Invalid target section' });
    }
    if (!actionType || !['copy', 'move'].includes(actionType)) {
      return res.status(400).json({ message: 'Invalid action type' });
    }

    const items = await NewRelease.find({ _id: { $in: ids } });
    if (items.length === 0) {
      return res.status(404).json({ message: 'No matching new releases found' });
    }

    const copiedItems = [];
    const isShowModel = ['TV Show', 'Short Web Series'].includes(targetSection);

    for (const item of items) {
      let newDoc;

      if (isShowModel) {
        const showData = {
          title: item.title,
          description: item.description,
          sortInfo: item.sortInfo,
          upcoming: item.upcoming,
          seriesAccess: item.access,
          language: item.language,
          genres: item.genres,
          actors: item.actors,
          directors: item.directors,
          imdbRating: item.imdbRating,
          contentRating: item.contentRating,
          poster: item.poster,
          thumbnail: item.thumbnail,
          status: item.status,
          releaseYear: item.releaseYear,
          videoQuality: item.videoQuality,
          seoTitle: item.seoTitle,
          metaDescription: item.metaDescription,
          keywords: item.keywords,
          imdbId: item.imdbId,
          contentType: targetSection,
          views: item.views
        };
        newDoc = new Show(showData);
      } else {
        const movieData = {
          imdbId: item.imdbId,
          title: item.title,
          contentType: targetSection,
          description: item.description,
          sortInfo: item.sortInfo,
          upcoming: item.upcoming,
          access: item.access,
          seriesAccess: item.access,
          language: item.language,
          genres: item.genres,
          actors: item.actors,
          directors: item.directors,
          imdbRating: item.imdbRating,
          contentRating: item.contentRating,
          duration: item.duration,
          status: item.status,
          thumbnail: item.thumbnail,
          poster: item.poster,
          trailerUrl: item.trailerUrl,
          videoType: item.videoType,
          videoQuality: item.videoQuality,
          videoFile: item.videoFile,
          videoFile480: item.videoFile480,
          videoFile720: item.videoFile720,
          videoFile1080: item.videoFile1080,
          subtitlesActive: item.subtitlesActive,
          subtitles: item.subtitles,
          seoTitle: item.seoTitle,
          metaDescription: item.metaDescription,
          keywords: item.keywords,
          views: item.views,
          releaseDate: item.releaseYear ? new Date(`${item.releaseYear}-01-01`) : undefined
        };
        newDoc = new Movie(movieData);
      }

      await newDoc.save();
      copiedItems.push(newDoc);

      if (actionType === 'move') {
        const newPostType = targetSection;
        const newUserContentType = isShowModel ? 'show' : 'movie';

        // Update Sliders
        await Slider.updateMany(
          { contentId: String(item._id), postType: 'New Release' },
          { $set: { contentId: String(newDoc._id), postType: newPostType } }
        );

        // Update User watchlists
        await User.updateMany(
          { "watchlist.contentId": item._id },
          { $set: { "watchlist.$.contentId": newDoc._id, "watchlist.$.contentType": newUserContentType } }
        );

        // Update Ratings
        await Rating.updateMany(
          { contentId: item._id },
          { $set: { contentId: newDoc._id } }
        );
      }
    }

    if (actionType === 'move') {
      await NewRelease.deleteMany({ _id: { $in: ids } });
    }

    res.json({
      message: `Successfully ${actionType}ed ${items.length} item(s) to ${targetSection}s`,
      copiedCount: copiedItems.length
    });

  } catch (err) {
    console.error('[SERVER ERROR] POST /api/new-releases/copy-move:', err);
    res.status(500).json({ message: err.message });
  }
});

// Profile Update Route
app.put('/api/profile/update', upload.single('profileImage'), async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const updateData = { name, email, phone };

    if (password) {
      updateData.password = password; // Will be hashed by pre-save hook
    }

    if (req.file) {
      updateData.profileImage = req.file.path;
    }

    // Since we are not using auth middleware for this demo, we'll just find the first admin
    const user = await User.findOne({ role: 'admin' });
    if (!user) return res.status(404).json({ message: 'Admin user not found' });

    Object.assign(user, updateData);
    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current profile
app.get('/api/profile', async (req, res) => {
  try {
    const user = await User.findOne({ role: 'admin' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/video_ott';

// Seed Experiences if empty
const seedExperiences = async () => {
  try {
    const count = await Experience.countDocuments();
    if (count === 0) {
      await Experience.create([
        { title: 'Access while traveling', description: 'Keep access to your entertainment content while roaming the world. Pick from thousands.', icon: 'Globe', order: 1 },
        { title: 'Stream with no interruptions', description: 'Pause for snacks, not buffering. Stream smoothly with our lightning-fast protocol network.', icon: 'MonitorPlay', order: 2 },
        { title: 'Stay secure at all times', description: 'Securely access and enjoy your favorite content, even on public Wi-Fi. Your connection.', icon: 'Shield', order: 3 }
      ]);
      console.log('Experiences seeded successfully');
    }
  } catch (err) {
    console.error('Seeding error:', err);
  }
};

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 45000,
      socketTimeoutMS: 120000, // 2 minutes
      connectTimeoutMS: 60000, // 1 minute
      family: 4, 
      maxPoolSize: 50,
      retryWrites: true,
      retryReads: true,
      heartbeatFrequencyMS: 10000
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Run seeds only after a stable connection
    await runAllSeeds();
    console.log('MongoDB connection stable and ready.');
  } catch (err) {
    console.error('CRITICAL: MongoDB connection failed:', err.message);
    // On critical failure, wait and retry instead of exiting immediately
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

mongoose.connection.on('error', err => {
  console.error('Mongoose live connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected. Awaiting automatic reconnection...');
});

// Start listening immediately to prevent Hostinger 500/504 deployment/health check timeout
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

connectDB();

// Coupon Routes
app.get('/api/coupons', async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/coupons', async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.status(201).json(coupon);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/api/coupons/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/coupons/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json(coupon);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/coupons/:id', async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/coupons/validate', async (req, res) => {
  try {
    const { couponCode } = req.body;
    if (!couponCode) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    const coupon = await Coupon.findOne({ couponCode: { $regex: new RegExp('^' + couponCode.trim() + '$', 'i') } });
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    if (coupon.status !== 'Active') {
      return res.status(400).json({ message: 'This coupon is inactive' });
    }

    // Expiry Date check (format: YYYY-MM-DD)
    const todayStr = new Date().toISOString().split('T')[0];
    if (coupon.expiryDate && coupon.expiryDate < todayStr) {
      return res.status(400).json({ message: 'This coupon has expired' });
    }

    // Usage check
    if (coupon.couponUsed !== undefined && coupon.usersAllow !== undefined) {
      if (coupon.couponUsed >= coupon.usersAllow) {
        return res.status(400).json({ message: 'This coupon has reached its usage limit' });
      }
    }

    res.json({
      valid: true,
      couponPercentage: coupon.couponPercentage,
      couponCode: coupon.couponCode
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Transaction Routes
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const seedTransactions = async () => {
  try {
    const count = await Transaction.countDocuments();
    if (count === 0) {
      const txs = [
        { name: 'Reza Mukti', email: 'rez*******io', plan: 'Basic Plan', amount: '₹ 10.00', gateway: 'Stripe', paymentId: 'pi_3TQ5E3GlcmJdOC6f1OQRQaG6', paymentDate: 'Apr 25 2026 05:53 PM' },
        { name: 'Kuldip Viaviweb', email: 'kul*******iweb@gmail.com', plan: 'Basic Plan', amount: '₹ 10.00', gateway: 'Payu', paymentId: '403993715537083818', paymentDate: 'Mar 27 2026 05:17 PM' },
        { name: 'Kuldip Viaviweb', email: 'kul*******iweb@gmail.com', plan: 'Premium Plan', amount: '₹ 29.99', gateway: 'Stripe', paymentId: 'pi_3TFThvGlcmJdOC6f1qF9wBYQ', paymentDate: 'Mar 27 2026 11:47 AM' },
        { name: 'Kuldip Viaviweb', email: 'kul*******iweb@gmail.com', plan: 'Basic Plan', amount: '₹ 10.00', gateway: 'Stripe', paymentId: 'pi_3TFTg9GlcmJdOC6f1yaE2ROk', paymentDate: 'Mar 27 2026 11:45 AM' },
        { name: 'Noordin Mohamed', email: 'noo*******med252@gmail.com', plan: 'Basic Plan', amount: '₹ 10.00', gateway: 'Stripe', paymentId: 'pi_3TDu66GlcmJdOC6f0xrlG05B', paymentDate: 'Mar 23 2026 03:34 AM' },
        { name: 'Gaming _', email: 'gam*******al8101@gmail.com', plan: 'Diamond Plan', amount: '₹ 149.00', gateway: 'Cashfree', paymentId: 'PS_WEB_18381772724052', paymentDate: 'Mar 05 2026 08:51 PM' },
        { name: 'Ashwini', email: 'ash*******web@gmail.com', plan: 'Diamond Plan', amount: '₹ 149.00', gateway: 'Apple', paymentId: '14321123022026', paymentDate: 'Feb 23 2026 11:32 AM' },
        { name: 'Ashwini', email: 'ash*******web@gmail.com', plan: 'Platinum Plan', amount: '₹ 99.00', gateway: 'Apple', paymentId: '51311123022026', paymentDate: 'Feb 23 2026 11:31 AM' },
        { name: 'Ashwini', email: 'ash*******web@gmail.com', plan: 'Premium Plan', amount: '₹ 29.99', gateway: 'IAP', paymentId: '57281123022026', paymentDate: 'Feb 23 2026 11:28 AM' },
        { name: 'Ashwini', email: 'ash*******web@gmail.com', plan: 'Basic Plan', amount: '₹ 10.00', gateway: 'IAP', paymentId: '28281123022026', paymentDate: 'Feb 23 2026 11:28 AM' }
      ];
      await Transaction.insertMany(txs);
      console.log('Transactions seeded');
    }
  } catch (err) {
    console.error('Error seeding transactions:', err);
  }
};
// seedTransactions();

// Payment Gateway Routes
app.get('/api/payment-gateways', async (req, res) => {
  try {
    const gateways = await PaymentGateway.find();
    res.json(gateways);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/payment-gateways/:id', async (req, res) => {
  try {
    const gateway = await PaymentGateway.findById(req.params.id);
    if (!gateway) return res.status(404).json({ message: 'Gateway not found' });
    res.json(gateway);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/payment-gateways/:id', async (req, res) => {
  try {
    const { name, status, settings } = req.body;
    const gateway = await PaymentGateway.findById(req.params.id);
    if (!gateway) return res.status(404).json({ message: 'Gateway not found' });

    if (name) gateway.name = name;
    if (status) gateway.status = status;
    if (settings) {
      gateway.settings = {
        ...gateway.settings,
        ...settings
      };
      gateway.markModified('settings');
    }

    await gateway.save();
    res.json(gateway);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

const seedGateways = async () => {
  try {
    // 1. Delete legacy gateways
    await PaymentGateway.deleteMany({ name: { $nin: ['PhonePe', 'Razorpay'] } });

    // 2. Ensure PhonePe exists uniquely
    const phonePeCount = await PaymentGateway.countDocuments({ name: 'PhonePe' });
    if (phonePeCount === 0) {
      await PaymentGateway.create({
        name: 'PhonePe',
        status: 'Active',
        settings: { merchantId: '', secretKey: '', publishableKey: '', isSandbox: true }
      });
    } else if (phonePeCount > 1) {
      // Find all but the first one and delete, or just reset
      await PaymentGateway.deleteMany({ name: 'PhonePe' });
      await PaymentGateway.create({
        name: 'PhonePe',
        status: 'Active',
        settings: { merchantId: '', secretKey: '', publishableKey: '', isSandbox: true }
      });
    }

    // 3. Ensure Razorpay exists uniquely
    const razorpayCount = await PaymentGateway.countDocuments({ name: 'Razorpay' });
    if (razorpayCount === 0) {
      await PaymentGateway.create({
        name: 'Razorpay',
        status: 'Active',
        settings: { merchantId: '', secretKey: '', publishableKey: '', isSandbox: true }
      });
    } else if (razorpayCount > 1) {
      // Find all but the first one and delete, or just reset
      await PaymentGateway.deleteMany({ name: 'Razorpay' });
      await PaymentGateway.create({
        name: 'Razorpay',
        status: 'Active',
        settings: { merchantId: '', secretKey: '', publishableKey: '', isSandbox: true }
      });
    }

    console.log('Payment Gateways synced (PhonePe and Razorpay seeded uniquely)');
  } catch (err) {
    console.error('Error seeding gateways:', err);
  }
};
// seedGateways();

// Page Routes
app.post('/api/pages', async (req, res) => {
  try {
    const { title, slug, description, content, status } = req.body;
    const newPage = new Page({
      title,
      slug,
      content: content || description || '',
      status: status || 'Active'
    });
    await newPage.save();
    res.status(201).json(newPage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/api/pages', async (req, res) => {
  try {
    const pages = await Page.find();
    res.json(pages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/pages/:id', async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ message: 'Page not found' });
    res.json(page);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/pages/:id', async (req, res) => {
  try {
    const page = await Page.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!page) return res.status(404).json({ message: 'Page not found' });
    res.json(page);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/pages/:id', async (req, res) => {
  try {
    await Page.findByIdAndDelete(req.params.id);
    res.json({ message: 'Page deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const seedPages = async () => {
  try {
    const count = await Page.countDocuments();
    if (count === 0) {
      const defaultPages = [
        { title: 'About Us', slug: 'about-us', status: 'Active' },
        { title: 'Terms Of Use', slug: 'terms-of-use', status: 'Active' },
        { title: 'Privacy Policy', slug: 'privacy-policy', status: 'Active' },
        { title: 'FAQ', slug: 'faq', status: 'Active' },
        { title: 'Contact Us', slug: 'contact-us', status: 'Active' }
      ];
      await Page.insertMany(defaultPages);
      console.log('Default pages seeded');
    }
  } catch (err) {
    console.error('Error seeding pages:', err);
  }
};

const sanitizeSettingsBody = (body) => {
  const updateData = { ...body };
  delete updateData._id;
  delete updateData.__v;
  delete updateData.createdAt;
  delete updateData.updatedAt;
  return updateData;
};

// Player Settings Routes
app.get('/api/player-settings', async (req, res) => {
  try {
    let settings = await PlayerSettings.findOne();
    if (!settings) {
      settings = new PlayerSettings();
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/player-settings', async (req, res) => {
  try {
    let settings = await PlayerSettings.findOne();
    const cleanBody = sanitizeSettingsBody(req.body);
    if (!settings) {
      settings = new PlayerSettings(cleanBody);
    } else {
      Object.assign(settings, cleanBody);
    }
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

const seedPlayerSettings = async () => {
  try {
    const count = await PlayerSettings.countDocuments();
    if (count === 0) {
      await PlayerSettings.create({});
      console.log('Default player settings seeded');
    }
  } catch (err) {
    console.error('Error seeding player settings:', err);
  }
};
// Player Ads Routes
app.get('/api/player-ads', async (req, res) => {
  try {
    let ads = await PlayerAds.findOne();
    if (!ads) {
      ads = new PlayerAds();
      await ads.save();
    }
    res.json(ads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/player-ads', async (req, res) => {
  try {
    let ads = await PlayerAds.findOne();
    const cleanBody = sanitizeSettingsBody(req.body);
    if (!ads) {
      ads = new PlayerAds(cleanBody);
    } else {
      Object.assign(ads, cleanBody);
    }
    await ads.save();
    res.json(ads);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/api/vast-proxy', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    console.log(`[VAST-PROXY] Fetching VAST XML from: ${url}`);
    const response = await axios.get(url, { timeout: 8000 });
    const xml = response.data;

    // Robust regex parsing for XML structure
    const mediaFileMatch = xml.match(/<MediaFile[^>]*>([\s\S]*?)<\/MediaFile>/i);
    const clickThroughMatch = xml.match(/<ClickThrough[^>]*>([\s\S]*?)<\/ClickThrough>/i);

    let mediaUrl = '';
    if (mediaFileMatch && mediaFileMatch[1]) {
      mediaUrl = mediaFileMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
    }

    let clickUrl = '';
    if (clickThroughMatch && clickThroughMatch[1]) {
      clickUrl = clickThroughMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
    }

    console.log(`[VAST-PROXY] Resolved mediaUrl: "${mediaUrl}", clickUrl: "${clickUrl}"`);
    res.json({ mediaUrl, clickUrl });
  } catch (err) {
    console.error('[VAST-PROXY] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


const seedPlayerAds = async () => {
  try {
    const count = await PlayerAds.countDocuments();
    if (count === 0) {
      await PlayerAds.create({});
      console.log('Default player ads seeded');
    }
  } catch (err) {
    console.error('Error seeding player ads:', err);
  }
};
// General Settings Routes
app.get('/api/general-settings', async (req, res) => {
  try {
    let settings = await GeneralSettings.findOne();
    if (!settings) {
      settings = new GeneralSettings();
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/general-settings', async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    let settings = await GeneralSettings.findOne();
    if (!settings) {
      settings = new GeneralSettings(updateData);
    } else {
      Object.assign(settings, updateData);
    }
    
    const savedSettings = await settings.save();
    console.log('General settings updated successfully');
    res.json(savedSettings);
  } catch (err) {
    console.error('Error updating general settings:', err);
    res.status(400).json({ message: err.message });
  }
});

const seedGeneralSettings = async () => {
  try {
    const count = await GeneralSettings.countDocuments();
    if (count === 0) {
      await GeneralSettings.create({});
      console.log('Default general settings seeded');
    }
  } catch (err) {
    console.error('Error seeding general settings:', err);
  }
};
// SMTP Settings Routes
app.get('/api/smtp-settings', async (req, res) => {
  try {
    let settings = await SMTPSettings.findOne();
    if (!settings) {
      settings = new SMTPSettings();
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/smtp-settings', async (req, res) => {
  try {
    let settings = await SMTPSettings.findOne();
    const cleanBody = sanitizeSettingsBody(req.body);
    if (!settings) {
      settings = new SMTPSettings(cleanBody);
    } else {
      Object.assign(settings, cleanBody);
    }
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/api/smtp-settings/test', async (req, res) => {
  try {
    let { host, port, email, password, encryption } = req.body || {};
    
    // If password is not provided (common in tests), try to get it from DB
    if (!password || password === '') {
      const existingSettings = await SMTPSettings.findOne();
      if (existingSettings) {
        password = existingSettings.password;
      }
    }

    if (!host || !email || !password) {
      return res.status(400).json({ message: 'Incomplete SMTP settings or missing password for discovery.' });
    }
    
    // Create temporary transporter for testing
    const normalizedPass = password.replace(/\s/g, '');
    console.log(`Attempting SMTP Test for: ${email} on ${host}:${port}. Pass starts with: ${normalizedPass.substring(0, 3)}...`);
    
    const transporterConfig = {
      auth: {
        user: email,
        pass: normalizedPass,
      },
      authMethod: 'LOGIN',
      tls: {
        rejectUnauthorized: false
      },
      logger: true,
      debug: true,
    };

    if (host === 'smtp.gmail.com') {
      transporterConfig.service = 'gmail';
    } else {
      transporterConfig.host = host;
      transporterConfig.port = port;
      transporterConfig.secure = encryption === 'SSL' || Number(port) === 465;
    }

    const testTransporter = nodemailer.createTransport(transporterConfig);

    // Verify connection
    await testTransporter.verify();
    console.log('SMTP Test Connection Verified Successfully');
    
    // Attempt to send a test email
    const mailOptions = {
      from: email,
      to: email,
      subject: 'SMTP Test Email - Video OTT Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #050505; color: #fff; padding: 40px; border-radius: 20px;">
          <h2 style="color: #00c853; text-align: center;">SMTP Test Successful</h2>
          <p>This is a test email dispatched to verify your SMTP configuration discovery.</p>
          <p>If you are reading this, your mail gateway is technically robust and ready for professional interaction.</p>
          <hr style="border: none; border-top: 1px solid #222; margin: 30px 0;" />
          <p style="font-size: 0.8rem; color: #666; text-align: center;">© 2026 Video OTT Platform. All rights reserved.</p>
        </div>
      `,
    };

    await testTransporter.sendMail(mailOptions);
    res.json({ message: 'SMTP Test successful! Verification email sent.' });
  } catch (err) {
    console.error('SMTP Test Failed:', err);
    res.status(500).json({ message: `SMTP Test Failed: ${err.message}` });
  }
});

const seedSMTPSettings = async () => {
  try {
    const count = await SMTPSettings.countDocuments();
    if (count === 0) {
      await SMTPSettings.create({});
      console.log('Default SMTP settings seeded');
    }
  } catch (err) {
    console.error('Error seeding SMTP settings:', err);
  }
};
// Social Login Settings Routes
app.get('/api/social-login-settings', async (req, res) => {
  try {
    let settings = await SocialLoginSettings.findOne();
    if (!settings) {
      settings = new SocialLoginSettings();
      await settings.save();
    }
    const responseSettings = settings.toObject();
    if ((!responseSettings.googleClientId || responseSettings.googleClientId === 'Hidden in Demo') && process.env.GOOGLE_CLIENT_ID) {
      responseSettings.googleClientId = process.env.GOOGLE_CLIENT_ID;
    }
    if ((!responseSettings.googleSecret || responseSettings.googleSecret === 'Hidden in Demo') && process.env.GOOGLE_CLIENT_SECRET) {
      responseSettings.googleSecret = process.env.GOOGLE_CLIENT_SECRET;
    }
    if ((!responseSettings.facebookAppId || responseSettings.facebookAppId === 'Hidden in Demo') && process.env.FACEBOOK_APP_ID) {
      responseSettings.facebookAppId = process.env.FACEBOOK_APP_ID;
    }
    if ((!responseSettings.facebookClientSecret || responseSettings.facebookClientSecret === 'Hidden in Demo') && process.env.FACEBOOK_APP_SECRET) {
      responseSettings.facebookClientSecret = process.env.FACEBOOK_APP_SECRET;
    }
    res.json(responseSettings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/social-login-settings', async (req, res) => {
  try {
    let settings = await SocialLoginSettings.findOne();
    const cleanBody = sanitizeSettingsBody(req.body);
    if (!settings) {
      settings = new SocialLoginSettings(cleanBody);
    } else {
      Object.assign(settings, cleanBody);
    }
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

const seedSocialLoginSettings = async () => {
  try {
    const count = await SocialLoginSettings.countDocuments();
    if (count === 0) {
      await SocialLoginSettings.create({});
      console.log('Default social login settings seeded');
    }
  } catch (err) {
    console.error('Error seeding social login settings:', err);
  }
};
// Menu Settings Routes
app.get('/api/menu-settings', async (req, res) => {
  try {
    let settings = await MenuSettings.findOne();
    if (!settings) {
      settings = new MenuSettings();
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/menu-settings', async (req, res) => {
  try {
    let settings = await MenuSettings.findOne();
    const cleanBody = sanitizeSettingsBody(req.body);
    if (!settings) {
      settings = new MenuSettings(cleanBody);
    } else {
      Object.assign(settings, cleanBody);
    }
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

const seedMenuSettings = async () => {
  try {
    const count = await MenuSettings.countDocuments();
    if (count === 0) {
      await MenuSettings.create({});
      console.log('Default menu settings seeded');
    }
  } catch (err) {
    console.error('Error seeding menu settings:', err);
  }
};
// reCAPTCHA Settings Routes
app.get('/api/recaptcha-settings', async (req, res) => {
  try {
    let settings = await ReCaptchaSettings.findOne();
    if (!settings) {
      settings = new ReCaptchaSettings();
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/recaptcha-settings', async (req, res) => {
  try {
    let settings = await ReCaptchaSettings.findOne();
    const cleanBody = sanitizeSettingsBody(req.body);
    if (!settings) {
      settings = new ReCaptchaSettings(cleanBody);
    } else {
      Object.assign(settings, cleanBody);
    }
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

const seedReCaptchaSettings = async () => {
  try {
    const count = await ReCaptchaSettings.countDocuments();
    if (count === 0) {
      await ReCaptchaSettings.create({});
      console.log('Default reCAPTCHA settings seeded');
    }
  } catch (err) {
    console.error('Error seeding reCAPTCHA settings:', err);
  }
};
// Banner Ads Routes
app.get('/api/banner-ads', async (req, res) => {
  try {
    let ads = await BannerAds.findOne();
    if (!ads) {
      ads = new BannerAds();
      await ads.save();
    }
    res.json(ads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/banner-ads', async (req, res) => {
  try {
    let ads = await BannerAds.findOne();
    const cleanBody = sanitizeSettingsBody(req.body);
    if (!ads) {
      ads = new BannerAds(cleanBody);
    } else {
      Object.assign(ads, cleanBody);
    }
    await ads.save();
    res.json(ads);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

const seedBannerAds = async () => {
  try {
    const count = await BannerAds.countDocuments();
    if (count === 0) {
      await BannerAds.create({});
      console.log('Default banner ads seeded');
    }
  } catch (err) {
    console.error('Error seeding banner ads:', err);
  }
};
// Maintenance Settings Routes
app.get('/api/maintenance-settings', async (req, res) => {
  try {
    let settings = await MaintenanceSettings.findOne();
    if (!settings) {
      settings = new MaintenanceSettings();
      await settings.save();
    }

    // Auto-expire maintenance mode if the end time has passed
    if (settings.status && settings.endTime && new Date(settings.endTime) <= new Date()) {
      settings.status = false;
      await settings.save();
      console.log('[Maintenance] Auto-expired maintenance mode because the end time was reached:', settings.endTime);
    }

    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/maintenance-settings', async (req, res) => {
  try {
    let settings = await MaintenanceSettings.findOne();
    const cleanBody = sanitizeSettingsBody(req.body);
    if (!settings) {
      settings = new MaintenanceSettings(cleanBody);
    } else {
      Object.assign(settings, cleanBody);
    }
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

const seedMaintenanceSettings = async () => {
  try {
    const count = await MaintenanceSettings.countDocuments();
    if (count === 0) {
      await MaintenanceSettings.create({});
      console.log('Default maintenance settings seeded');
    }
  } catch (err) {
    console.error('Error seeding maintenance settings:', err);
  }
};
// Android App Routes
const createAndroidRoutes = (path, model, seedName) => {
  app.get(`/api/android-app/${path}`, async (req, res) => {
    try {
      let settings = await model.findOne();
      if (!settings) {
        settings = new model();
        await settings.save();
      }
      res.json(settings);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put(`/api/android-app/${path}`, async (req, res) => {
    try {
      let settings = await model.findOne();
      const cleanBody = sanitizeSettingsBody(req.body);
      if (!settings) {
        settings = new model(cleanBody);
      } else {
        Object.assign(settings, cleanBody);
      }
      await settings.save();
      res.json(settings);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
};

createAndroidRoutes('verify', AppVerifySettings, 'verify');
createAndroidRoutes('settings', AndroidAppSettings, 'settings');
createAndroidRoutes('ads', AppAdSettings, 'ads');
createAndroidRoutes('notification', AppNotificationSettings, 'notification');

app.post('/api/android-app/notification/send', async (req, res) => {
  try {
    const settings = await AppNotificationSettings.findOne();
    if (!settings || !settings.onesignalAppId || !settings.onesignalRestApiKey) {
      return res.status(400).json({ message: 'OneSignal Push Notification credentials are not configured in settings.' });
    }

    const { title, message, imageUrl, externalLink } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and Message are required' });
    }

    const payload = {
      app_id: settings.onesignalAppId,
      headings: { en: title },
      contents: { en: message },
      included_segments: ['All']
    };

    if (imageUrl && imageUrl.trim() !== '') {
      payload.big_picture = imageUrl.trim();
      payload.ios_attachments = { id1: imageUrl.trim() };
    }

    if (externalLink && externalLink.trim() !== '') {
      payload.url = externalLink.trim();
      payload.data = { externalLink: externalLink.trim() };
    }

    console.log('[OneSignal] Sending push notification with payload:', payload);

    const response = await axios.post('https://onesignal.com/api/v1/notifications', payload, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${settings.onesignalRestApiKey}`
      }
    });

    console.log('[OneSignal] Response status:', response.status, 'Response data:', response.data);
    res.json({ message: 'Push Notification Sent Successfully', data: response.data });
  } catch (err) {
    const errMsg = err.response?.data || err.message;
    console.error('[OneSignal] Error sending push notification:', errMsg);
    res.status(500).json({ message: 'Failed to send push notification', error: errMsg });
  }
});

const seedAndroidApp = async () => {
  try {
    if (await AppVerifySettings.countDocuments() === 0) await AppVerifySettings.create({});
    if (await AndroidAppSettings.countDocuments() === 0) await AndroidAppSettings.create({});
    if (await AppAdSettings.countDocuments() === 0) await AppAdSettings.create({});
    if (await AppNotificationSettings.countDocuments() === 0) await AppNotificationSettings.create({});
    console.log('Android app settings seeded');
  } catch (err) {
    console.error('Error seeding android app settings:', err);
  }
};

const runAllSeeds = async () => {
  try {
    console.log('Starting data seeding sequence...');
    await seedAndroidApp();
    await seedMaintenanceSettings();
    await seedBannerAds();
    await seedReCaptchaSettings();
    await seedMenuSettings();
    await seedSocialLoginSettings();
    await seedSMTPSettings();
    await seedGeneralSettings();
    await seedPlayerAds();
    await seedPlayerSettings();
    await seedPages();
    await seedAdmin();
    await seedTransactions();
    await seedGateways();
    await seedSliders();
    await seedExperiences();
    await seedPlans();
    await seedHomeSections();
    console.log('Seeding sequence completed.');
  } catch (err) {
    console.error('Seeding sequence failed:', err);
  }
};

    const seedPlans = async () => {
      try {
        const plansCount = await SubscriptionPlan.countDocuments();
        if (plansCount === 0) {
          const plans = [
            { planName: 'Basic Plan', duration: '7 Day(s)', price: '₹ 10.00', deviceLimit: '1', ads: 'ON', status: 'Active' },
            { planName: 'Premium Plan', duration: '1 Month(s)', price: '₹ 29.99', deviceLimit: '1', ads: 'ON', status: 'Active' },
            { planName: 'Platinum Plan', duration: '6 Month(s)', price: '₹ 99.00', deviceLimit: '1', ads: 'OFF', status: 'Active' },
            { planName: 'Diamond Plan', duration: '1 Year(s)', price: '₹ 149.00', deviceLimit: '2', ads: 'OFF', status: 'Active' }
          ];
          await SubscriptionPlan.insertMany(plans);
          console.log('Subscription plans seeded');
        }
      } catch (err) {
        console.error('Error seeding plans:', err.message);
      }
    };
    // seedPlans();

// Payment// Helper to send subscription email
const sendSubscriptionSuccessEmail = async (user, plan, txnId, req = null) => {
  try {
    const dynamicTransporter = await getTransporter();
    const clientUrl = req ? getClientUrl(req) : 'https://lemoott.com';
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Video OTT Platform <noreply@video.com>',
      to: user.email,
      subject: 'Subscription Successful - Video OTT Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #050505; color: #fff; padding: 40px; border-radius: 20px;">
          <h2 style="color: #b3d332; text-align: center;">Subscription Activated!</h2>
          <p>Hi ${user.name},</p>
          <p>Thank you for subscribing! Your payment was successful and your subscription is now active.</p>
          <div style="background: #111; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #222;">
            <p style="margin: 5px 0;"><strong>Plan:</strong> ${plan.planName}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> ${plan.price}</p>
            <p style="margin: 5px 0;"><strong>Duration:</strong> ${plan.duration}</p>
            <p style="margin: 5px 0;"><strong>Expires On:</strong> ${new Date(user.expiryDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${txnId}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${clientUrl}/user/profile" style="background: #b3d332; color: #000; text-decoration: none; padding: 15px 30px; border-radius: 30px; font-weight: bold; display: inline-block;">VIEW PROFILE</a>
          </div>
          <hr style="border: none; border-top: 1px solid #222; margin: 30px 0;" />
          <p style="font-size: 0.8rem; color: #666; text-align: center;">© 2026 Video OTT Platform. All rights reserved.</p>
        </div>
      `,
    };
    await dynamicTransporter.sendMail(mailOptions);
    console.log('Subscription success email sent to', user.email);
  } catch (emailErr) {
    console.error('Failed to send subscription email:', emailErr);
  }
};

// Mock Payment Success
app.post('/api/payment/mock-success', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Session expired, please login again' });
    }
    
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isStaff = ['admin', 'sub-admin'].includes(user.role);
    if (!isStaff) {
      const sessionExists = (user.activeSessions || []).some(s => s.token === token);
      if (!sessionExists) {
        return res.status(401).json({ message: 'Unauthorized: Session has been invalidated or logged out' });
      }
    }
    
    const plan = await SubscriptionPlan.findById(req.body.planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    
    // Safety check: ensure they are not trying to purchase another plan while already subscribed
    const todayStr = new Date().toISOString().split('T')[0];
    const isExpired = user.expiryDate && user.expiryDate < todayStr;
    if (user.subscriptionPlan && !isExpired && user.subscriptionPlan !== plan.planName) {
      const activePlanObj = await SubscriptionPlan.findOne({ planName: user.subscriptionPlan });
      if (activePlanObj) {
        const activePriceStr = activePlanObj.price ? activePlanObj.price.toString().trim().toLowerCase().replace(/[^\d.]/g, '') : '';
        const isActiveFree = activePriceStr === '0' || activePriceStr === '0.00' || activePriceStr === '' || activePriceStr === 'free' || parseFloat(activePriceStr) === 0;
        if (!isActiveFree) {
          return res.status(400).json({ message: 'You already have an active subscription plan.' });
        }
      }
    }
    
    // Update user subscription
    user.subscriptionPlan = plan.planName;
    user.role = 'subscriber';
    user.status = 'Active';
    
    // Calculate expiry date
    const durationStr = plan.duration.toLowerCase();
    const durationNum = parseInt(durationStr) || 1;
    const expiry = new Date();
    if (durationStr.includes('month')) {
      expiry.setMonth(expiry.getMonth() + durationNum);
    } else if (durationStr.includes('year')) {
      expiry.setFullYear(expiry.getFullYear() + durationNum);
    } else if (durationStr.includes('day')) {
      expiry.setDate(expiry.getDate() + durationNum);
    } else {
      expiry.setDate(expiry.getDate() + 30); // Default
    }
    user.expiryDate = expiry.toISOString().split('T')[0];
    
    await user.save();

    // Determine gateway name
    let gatewayName = 'Mock Gateway';
    if (req.body.gatewayId) {
      const PaymentGateway = require('./models/PaymentGateway');
      const gw = await PaymentGateway.findById(req.body.gatewayId);
      if (gw) gatewayName = gw.name;
    }

    // Calculate final price with coupon if provided
    let finalAmountStr = plan.price.toString();
    let appliedCouponCode = null;

    if (req.body.couponCode) {
      const Coupon = require('./models/Coupon');
      const coupon = await Coupon.findOne({ couponCode: { $regex: new RegExp('^' + req.body.couponCode.trim() + '$', 'i') } });
      if (coupon && coupon.status === 'Active') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (!coupon.expiryDate || coupon.expiryDate >= todayStr) {
          if (coupon.couponUsed === undefined || coupon.usersAllow === undefined || coupon.couponUsed < coupon.usersAllow) {
            const priceVal = parseFloat(plan.price.replace(/[^\d.]/g, '')) || 0;
            const discount = (priceVal * coupon.couponPercentage) / 100;
            const finalPrice = Math.max(0, priceVal - discount);
            finalAmountStr = `₹ ${finalPrice.toFixed(2)}`;
            appliedCouponCode = coupon.couponCode;

            // Increment coupon usage
            coupon.couponUsed = (coupon.couponUsed || 0) + 1;
            await coupon.save();
          }
        }
      }
    }

    if (appliedCouponCode && parseFloat(finalAmountStr.replace(/[^\d.]/g, '')) === 0) {
      gatewayName = `Coupon: ${appliedCouponCode}`;
    }

    // Create a transaction record
    const Transaction = require('./models/Transaction');
    const tx = new Transaction({
      name: user.name || 'User',
      email: user.email,
      plan: plan.planName,
      amount: finalAmountStr,
      gateway: gatewayName,
      paymentId: 'MOCK_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      paymentDate: new Date().toISOString().split('T')[0],
      couponCode: appliedCouponCode
    });
    await tx.save();
    
    await sendSubscriptionSuccessEmail(user, plan, tx.paymentId, req);
    
    res.json({ message: 'Payment successful', user: {
      status: user.status,
      subscriptionPlan: user.subscriptionPlan,
      expiryDate: user.expiryDate
    }});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Free Payment Success
app.post('/api/payment/free-success', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Session expired, please login again' });
    }
    
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isStaff = ['admin', 'sub-admin'].includes(user.role);
    if (!isStaff) {
      const sessionExists = (user.activeSessions || []).some(s => s.token === token);
      if (!sessionExists) {
        return res.status(401).json({ message: 'Unauthorized: Session has been invalidated or logged out' });
      }
    }
    
    const plan = await SubscriptionPlan.findById(req.body.planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    
    // Safety check: ensure they are not trying to purchase another plan while already subscribed
    const todayStr = new Date().toISOString().split('T')[0];
    const isExpired = user.expiryDate && user.expiryDate < todayStr;
    if (user.subscriptionPlan && !isExpired && user.subscriptionPlan !== plan.planName) {
      const activePlanObj = await SubscriptionPlan.findOne({ planName: user.subscriptionPlan });
      if (activePlanObj) {
        const activePriceStr = activePlanObj.price ? activePlanObj.price.toString().trim().toLowerCase().replace(/[^\d.]/g, '') : '';
        const isActiveFree = activePriceStr === '0' || activePriceStr === '0.00' || activePriceStr === '' || activePriceStr === 'free' || parseFloat(activePriceStr) === 0;
        if (!isActiveFree) {
          return res.status(400).json({ message: 'You already have an active subscription plan.' });
        }
      }
    }
    
    // Safety check: ensure the plan price is actually zero/free
    const priceStr = plan.price ? plan.price.toString().trim().toLowerCase().replace(/[^\d.]/g, '') : '';
    const isFree = priceStr === '0' || priceStr === '0.00' || priceStr === '' || priceStr === 'free' || parseFloat(priceStr) === 0;
    if (!isFree) {
      return res.status(400).json({ message: 'This plan is not free and requires payment.' });
    }
    
    // Safety check: check if the plan has the getStarted toggle turned OFF
    if (plan.getStarted === 'OFF') {
      return res.status(400).json({ message: 'This free plan is currently unavailable for activation.' });
    }
    
    // Update user subscription
    user.subscriptionPlan = plan.planName;
    user.role = 'subscriber';
    user.status = 'Active';
    
    // Calculate expiry date
    const durationStr = plan.duration.toLowerCase();
    const durationNum = parseInt(durationStr) || 1;
    const expiry = new Date();
    if (durationStr.includes('month')) {
      expiry.setMonth(expiry.getMonth() + durationNum);
    } else if (durationStr.includes('year')) {
      expiry.setFullYear(expiry.getFullYear() + durationNum);
    } else if (durationStr.includes('day')) {
      expiry.setDate(expiry.getDate() + durationNum);
    } else {
      expiry.setDate(expiry.getDate() + 30); // Default
    }
    user.expiryDate = expiry.toISOString().split('T')[0];
    
    await user.save();

    // Create a transaction record
    const Transaction = require('./models/Transaction');
    const tx = new Transaction({
      name: user.name || 'User',
      email: user.email,
      plan: plan.planName,
      amount: '0',
      gateway: 'Free Activation',
      paymentId: 'FREE_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      paymentDate: new Date().toISOString().split('T')[0],
      userId: user._id,
      planId: plan._id
    });
    await tx.save();
    
    await sendSubscriptionSuccessEmail(user, plan, tx.paymentId, req);
    
    res.json({ message: 'Plan activated successfully', user: {
      status: user.status,
      subscriptionPlan: user.subscriptionPlan,
      expiryDate: user.expiryDate
    }});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PhonePe Config Debugger Route
app.get('/api/payment/phonepe/debug-config', async (req, res) => {
  try {
    const PaymentGateway = require('./models/PaymentGateway');
    const gw = await PaymentGateway.findOne({ name: 'PhonePe' });
    const creds = getPhonePeCredentials(gw);
    res.json({
      dbSettings: gw?.settings,
      resolvedCredentials: {
        merchantId: creds.merchantId,
        isSandbox: creds.isSandbox,
        saltKeyLength: creds.saltKey ? creds.saltKey.length : 0,
        saltIndex: creds.saltIndex
      }
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// PhonePe Initiate Payment
app.post('/api/payment/phonepe/initiate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Session expired, please login again' });
    }
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isStaff = ['admin', 'sub-admin'].includes(user.role);
    if (!isStaff) {
      const sessionExists = (user.activeSessions || []).some(s => s.token === token);
      if (!sessionExists) {
        return res.status(401).json({ message: 'Unauthorized: Session has been invalidated or logged out' });
      }
    }
    
    const plan = await SubscriptionPlan.findById(req.body.planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    
    // Safety check: ensure they are not trying to purchase another plan while already subscribed
    const todayStr = new Date().toISOString().split('T')[0];
    const isExpired = user.expiryDate && user.expiryDate < todayStr;
    if (user.subscriptionPlan && !isExpired && user.subscriptionPlan !== plan.planName) {
      const activePlanObj = await SubscriptionPlan.findOne({ planName: user.subscriptionPlan });
      if (activePlanObj) {
        const activePriceStr = activePlanObj.price ? activePlanObj.price.toString().trim().toLowerCase().replace(/[^\d.]/g, '') : '';
        const isActiveFree = activePriceStr === '0' || activePriceStr === '0.00' || activePriceStr === '' || activePriceStr === 'free' || parseFloat(activePriceStr) === 0;
        if (!isActiveFree) {
          return res.status(400).json({ message: 'You already have an active subscription plan.' });
        }
      }
    }

    const PaymentGateway = require('./models/PaymentGateway');
    const gw = await PaymentGateway.findOne({ name: 'PhonePe' });
    if (!gw || gw.status !== 'Active') return res.status(400).json({ message: 'PhonePe is not active' });

    const { merchantId, saltKey, saltIndex, isSandbox } = getPhonePeCredentials(gw);

    const transactionId = 'TXN_' + Date.now() + Math.random().toString(36).substring(2, 7).toUpperCase();

    // Calculate final price with coupon if provided
    let finalAmountStr = plan.price.toString();
    let appliedCouponCode = null;
    let numericPrice = parseFloat(plan.price.toString().replace(/[^\d.]/g, '')) || 0;

    if (req.body.couponCode) {
      const Coupon = require('./models/Coupon');
      const coupon = await Coupon.findOne({ couponCode: { $regex: new RegExp('^' + req.body.couponCode.trim() + '$', 'i') } });
      if (coupon && coupon.status === 'Active') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (!coupon.expiryDate || coupon.expiryDate >= todayStr) {
          if (coupon.couponUsed === undefined || coupon.usersAllow === undefined || coupon.couponUsed < coupon.usersAllow) {
            const discount = (numericPrice * coupon.couponPercentage) / 100;
            numericPrice = Math.max(0, numericPrice - discount);
            finalAmountStr = `₹ ${numericPrice.toFixed(2)}`;
            appliedCouponCode = coupon.couponCode;
          }
        }
      }
    }

    if (numericPrice <= 0) {
      return res.status(400).json({ message: 'Plan price is 0 after discount. Please use free plan activation.' });
    }

    // Create a pending transaction
    const Transaction = require('./models/Transaction');
    const tx = new Transaction({
      name: user.name || 'User',
      email: user.email,
      plan: plan.planName,
      amount: finalAmountStr,
      gateway: 'PhonePe',
      paymentId: transactionId,
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      userId: user._id,
      planId: plan._id,
      couponCode: appliedCouponCode
    });
    await tx.save();

    const amountInPaise = Math.round(numericPrice * 100);
    
    // Using PhonePe V2 SDK
    const { StandardCheckoutClient, Env, StandardCheckoutPayRequest, MetaInfo, PrefillUserLoginDetails } = require('@phonepe-pg/pg-sdk-node');
    
    const env = isSandbox ? Env.SANDBOX : Env.PRODUCTION;
    const client = getPhonePeClient(merchantId, saltKey, saltIndex, env);

    const serverUrl = getServerUrl(req);
    const redirectUrl = `${serverUrl}/api/payment/phonepe/callback?txnId=${transactionId}`;
    
    let requestBuilder = StandardCheckoutPayRequest.builder()
        .merchantOrderId(transactionId)
        .amount(amountInPaise)
        .redirectUrl(redirectUrl);

    // Build prefill user login details if phone is available
    if (user.phone) {
      const phoneClean = user.phone.replace(/\D/g, '').slice(-10);
      if (phoneClean.length === 10) {
        try {
          const prefill = PrefillUserLoginDetails.builder()
              .phoneNumber(phoneClean)
              .build();
          requestBuilder = requestBuilder.prefillUserLoginDetails(prefill);
        } catch (e) {
          console.error("Prefill details builder error:", e);
        }
      }
    }

    // Build metaInfo
    try {
      const meta = MetaInfo.builder()
          .udf1("subscription")
          .udf2(plan.planName)
          .udf3(user._id.toString())
          .build();
      requestBuilder = requestBuilder.metaInfo(meta);
    } catch (e) {
      console.error("MetaInfo builder error:", e);
    }

    requestBuilder = requestBuilder
        .message(`Lemo OTT Subscription: ${plan.planName}`)
        .expireAfter(3600);

    const request = requestBuilder.build();

    const response = await client.pay(request);
    
    if (response && response.redirectUrl) {
      return res.json({ redirectUrl: response.redirectUrl });
    } else {
      return res.status(400).json({ message: 'Failed to initiate PhonePe V2 payment' });
    }
  } catch (error) {
    console.error('PhonePe init error', error);
    const apiError = error.message || 'Unknown SDK Error';
    res.status(500).json({ message: 'Payment gateway error: ' + apiError });
  }
});

// PhonePe Callback
app.all('/api/payment/phonepe/callback', async (req, res) => {
  try {
    const requestData = { ...req.query, ...req.body };
    let parsedData = requestData;
    
    if (requestData.response) {
      const decodedResponse = Buffer.from(requestData.response, 'base64').toString('utf8');
      parsedData = JSON.parse(decodedResponse);
    }
    
    const txnId = req.query.txnId || parsedData.data?.merchantTransactionId || parsedData.transactionId || requestData.transactionId || requestData.orderId;
    let successCode = parsedData.code || requestData.code || requestData.state || parsedData.state;

    if (!successCode && txnId) {
      const PaymentGateway = require('./models/PaymentGateway');
      const gw = await PaymentGateway.findOne({ name: 'PhonePe' });
      if (gw) {
        const { merchantId, saltKey, saltIndex, isSandbox } = getPhonePeCredentials(gw);
        
        const { StandardCheckoutClient, Env } = require('@phonepe-pg/pg-sdk-node');
        const env = isSandbox ? Env.SANDBOX : Env.PRODUCTION;
        const client = getPhonePeClient(merchantId, saltKey, saltIndex, env);
        
        try {
          const statusRes = await client.getOrderStatus(txnId);
          if (statusRes && statusRes.state) {
            successCode = statusRes.state === 'COMPLETED' ? 'PAYMENT_SUCCESS' : statusRes.state;
          } else if (statusRes && statusRes.code) {
            successCode = statusRes.code === 'PAYMENT_SUCCESS' ? 'PAYMENT_SUCCESS' : statusRes.code;
          }
        } catch(e) {
          console.error("Error querying order status:", e);
        }
      }
    }

    const Transaction = require('./models/Transaction');
    const tx = await Transaction.findOne({ paymentId: txnId });

    if (!tx) {
      require('fs').appendFileSync('phonepe_callback_error.txt', `Txn not found for ID: ${txnId}\n`);
      const clientUrl = getClientUrl(req);
      return res.redirect(`${clientUrl}/user/profile?payment_status=error`);
    }

    // You could optionally use the SDK's validateCallback here if needed:
    // const client = StandardCheckoutClient.getInstance(merchantId, saltKey, parseInt(saltIndex), env);
    // const isValid = client.validateCallback(req.headers['x-verify'], req.body.response);
    // For now, we trust the successCode since it's a redirect or direct callback.

    if (successCode === 'PAYMENT_SUCCESS') {
      tx.status = 'Completed';
      await tx.save();

      // Increment coupon usage if applied
      if (tx.couponCode) {
        const Coupon = require('./models/Coupon');
        const coupon = await Coupon.findOne({ couponCode: { $regex: new RegExp('^' + tx.couponCode.trim() + '$', 'i') } });
        if (coupon) {
          coupon.couponUsed = (coupon.couponUsed || 0) + 1;
          await coupon.save();
        }
      }

      // Upgrade User
      const user = await User.findById(tx.userId);
      const plan = await SubscriptionPlan.findById(tx.planId);
      
      if (user && plan) {
        user.subscriptionPlan = plan.planName;
        user.role = 'subscriber';
        user.status = 'Active';
        const durationStr = plan.duration.toLowerCase();
        const durationNum = parseInt(durationStr) || 1;
        const expiry = new Date();
        if (durationStr.includes('month')) expiry.setMonth(expiry.getMonth() + durationNum);
        else if (durationStr.includes('year')) expiry.setFullYear(expiry.getFullYear() + durationNum);
        else if (durationStr.includes('day')) expiry.setDate(expiry.getDate() + durationNum);
        else expiry.setDate(expiry.getDate() + 30);
        user.expiryDate = expiry.toISOString().split('T')[0];
        await user.save();
        
        // Fire and forget email to prevent hanging the redirect
        sendSubscriptionSuccessEmail(user, plan, txnId, req).catch(console.error);
      }
      const clientUrl = getClientUrl(req);
      return res.redirect(`${clientUrl}/user/profile?payment_status=success`);
    } else {
      tx.status = 'Failed';
      await tx.save();
      const clientUrl = getClientUrl(req);
      return res.redirect(`${clientUrl}/user/profile?payment_status=failed`);
    }
  } catch (err) {
    console.error('Callback error', err);
    const clientUrl = getClientUrl(req);
    res.redirect(`${clientUrl}/user/profile?payment_status=error`);
  }
});
// Subscription Plan Routes
app.get('/api/subscription-plans', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/subscription-plans', async (req, res) => {
  try {
    const plan = new SubscriptionPlan(req.body);
    await plan.save();
    res.status(201).json(plan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/api/subscription-plans/:id', async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/subscription-plans/:id', async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/subscription-plans/:id', async (req, res) => {
  try {
    await SubscriptionPlan.findByIdAndDelete(req.params.id);
    res.json({ message: 'Plan deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// TV Show Routes
app.get('/api/shows', async (req, res) => {
  try {
    const isAdmin = await isAdminRequest(req);
    const query = {};
    if (!isAdmin) {
      query.status = 'Active';
      const menuSettings = await MenuSettings.findOne().lean();
      if (menuSettings) {
        const showsOff = menuSettings.shows?.toUpperCase() === 'OFF';
        const webSeriesOff = menuSettings.webSeries?.toUpperCase() === 'OFF';

        if (showsOff && webSeriesOff) {
          return res.json([]);
        } else if (showsOff) {
          query.contentType = { $in: ['Short Web Series', 'Short Web-Series', 'web-series'] };
        } else if (webSeriesOff) {
          query.contentType = { $nin: ['Short Web Series', 'Short Web-Series', 'web-series'] };
        }
      }
    }

    if (req.query.contentType) {
      query.contentType = req.query.contentType;
    }
    const shows = await Show.find(query).sort({ createdAt: -1 });
    res.json(shows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/shows/:id', async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('actors')
      .populate('directors');
    if (!show) return res.status(404).json({ message: 'Show not found' });

    const isAdmin = await isAdminRequest(req);
    if (!isAdmin) {
      const menuSettings = await MenuSettings.findOne().lean();
      if (menuSettings) {
        const isShortWeb = show.contentType === 'Short Web Series' || show.contentType === 'Short Web-Series' || show.contentType === 'web-series';
        const showsOff = menuSettings.shows?.toUpperCase() === 'OFF';
        const webSeriesOff = menuSettings.webSeries?.toUpperCase() === 'OFF';
        if ((isShortWeb && webSeriesOff) || (!isShortWeb && showsOff)) {
          return res.status(403).json({ message: 'Content is disabled' });
        }
      }
    }

    const ratingCount = await Rating.countDocuments({ contentId: show._id });
    const showObj = show.toObject();
    showObj.ratingsCount = ratingCount;

    res.json(showObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/shows', async (req, res) => {
  try {
    const show = new Show(req.body);
    await show.save();
    res.status(201).json(show);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/shows/:id', async (req, res) => {
  try {
    const show = await Show.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(show);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/shows/:id', async (req, res) => {
  try {
    await Show.findByIdAndDelete(req.params.id);
    res.json({ message: 'Show deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Season Routes
app.get('/api/seasons', async (req, res) => {
  try {
    const filter = {};
    if (req.query.showId) filter.showId = req.query.showId;
    const seasons = await Season.find(filter).sort({ createdAt: 1 });
    res.json(seasons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Sports Category Routes
app.get('/api/sports-categories', async (req, res) => {
  try {
    const categories = await SportsCategory.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/sports-categories', async (req, res) => {
  const category = new SportsCategory(req.body);
  try {
    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/sports-categories/:id', async (req, res) => {
  try {
    const updatedCategory = await SportsCategory.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(updatedCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/sports-categories/:id', async (req, res) => {
  try {
    await SportsCategory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Sports Video Routes
app.get('/api/sports-videos', async (req, res) => {
  try {
    const isAdmin = await isAdminRequest(req);
    if (!isAdmin) {
      const menuSettings = await MenuSettings.findOne().lean();
      if (menuSettings && menuSettings.sports?.toUpperCase() === 'OFF') {
        return res.json([]);
      }
    }
    const videos = await SportsVideo.find().populate('category');
    const signedVideos = await signVideoDocuments(videos, req);
    res.json(signedVideos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/sports-videos/:id', async (req, res) => {
  try {
    const isAdmin = await isAdminRequest(req);
    if (!isAdmin) {
      const menuSettings = await MenuSettings.findOne().lean();
      if (menuSettings && menuSettings.sports?.toUpperCase() === 'OFF') {
        return res.status(403).json({ message: 'Content is disabled' });
      }
    }
    const video = await SportsVideo.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    const signedVideo = await signVideoDocument(video, req);
    res.json(signedVideo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/sports-videos', async (req, res) => {
  const video = new SportsVideo(req.body);
  try {
    const newVideo = await video.save();
    res.status(201).json(newVideo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/sports-videos/:id', async (req, res) => {
  try {
    const updatedVideo = await SportsVideo.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(updatedVideo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/sports-videos/:id', async (req, res) => {
  try {
    await SportsVideo.findByIdAndDelete(req.params.id);
    res.json({ message: 'Video deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/sports-videos/bulk-status', async (req, res) => {
  try {
    const { ids, status } = req.body;
    await SportsVideo.updateMany({ _id: { $in: ids } }, { status });
    res.json({ message: 'Bulk status updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/sports-videos/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    await SportsVideo.deleteMany({ _id: { $in: ids } });
    res.json({ message: 'Bulk delete successful' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


app.get('/api/seasons/:id', async (req, res) => {
  try {
    const season = await Season.findById(req.params.id)
      .populate('showId', 'title description genres poster thumbnail actors directors language releaseYear videoQuality');
    res.json(season);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/seasons', async (req, res) => {
  try {
    const season = new Season(req.body);
    await season.save();
    res.status(201).json(season);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/seasons/:id', async (req, res) => {
  try {
    const season = await Season.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(season);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/seasons/:id', async (req, res) => {
  try {
    await Season.findByIdAndDelete(req.params.id);
    res.json({ message: 'Season deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Episode Routes
app.get('/api/episodes', async (req, res) => {
  try {
    const filter = {};
    if (req.query.showId) filter.showId = req.query.showId;
    if (req.query.seasonId) filter.seasonId = req.query.seasonId;
    const episodes = await Episode.find(filter)
      .populate('showId', 'title contentType')
      .populate('seasonId', 'title')
      .sort({ createdAt: 1 });
    const signedEpisodes = await signVideoDocuments(episodes, req);
    res.json(signedEpisodes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/episodes/:id', async (req, res) => {
  try {
    const episode = await Episode.findById(req.params.id)
      .populate('showId', 'title contentType')
      .populate('seasonId', 'title');
    const signedEpisode = await signVideoDocument(episode, req);
    res.json(signedEpisode);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/episodes', async (req, res) => {
  try {
    const episode = new Episode(req.body);
    await episode.save();
    res.status(201).json(episode);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/episodes/:id', async (req, res) => {
  try {
    const episode = await Episode.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(episode);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/episodes/:id', async (req, res) => {
  try {
    await Episode.findByIdAndDelete(req.params.id);
    res.json({ message: 'Episode deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/episodes/duplicate/:id', async (req, res) => {
  try {
    const original = await Episode.findById(req.params.id);
    if (!original) return res.status(404).json({ message: 'Original episode not found' });
    
    const episodeData = original.toObject();
    delete episodeData._id;
    delete episodeData.createdAt;
    delete episodeData.updatedAt;
    
    episodeData.title = `${episodeData.title} (Copy)`;
    
    const newEpisode = new Episode(episodeData);
    await newEpisode.save();
    res.status(201).json(newEpisode);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/seasons/duplicate/:id', async (req, res) => {
  try {
    const original = await Season.findById(req.params.id);
    if (!original) return res.status(404).json({ message: 'Original season not found' });
    
    const seasonData = original.toObject();
    delete seasonData._id;
    delete seasonData.createdAt;
    delete seasonData.updatedAt;
    
    seasonData.title = `${seasonData.title} (Copy)`;
    
    const newSeason = new Season(seasonData);
    await newSeason.save();
    res.status(201).json(newSeason);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Live TV Routes
app.get('/api/tv-categories', async (req, res) => {
  try {
    const categories = await TVCategory.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/tv-categories', async (req, res) => {
  const category = new TVCategory(req.body);
  try {
    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/tv-categories/:id', async (req, res) => {
  try {
    const category = await TVCategory.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/tv-categories/:id', async (req, res) => {
  try {
    await TVCategory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/tv-channels', async (req, res) => {
  try {
    const isAdmin = await isAdminRequest(req);
    if (!isAdmin) {
      const menuSettings = await MenuSettings.findOne().lean();
      if (menuSettings && menuSettings.liveTv?.toUpperCase() === 'OFF') {
        return res.json([]);
      }
    }
    const channels = await TVChannel.find().populate('category').sort({ createdAt: -1 });
    res.json(channels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/tv-channels/:id', async (req, res) => {
  try {
    const isAdmin = await isAdminRequest(req);
    if (!isAdmin) {
      const menuSettings = await MenuSettings.findOne().lean();
      if (menuSettings && menuSettings.liveTv?.toUpperCase() === 'OFF') {
        return res.status(403).json({ message: 'Content is disabled' });
      }
    }
    const channel = await TVChannel.findById(req.params.id).populate('category');
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    const ratingCount = await Rating.countDocuments({ contentId: channel._id });
    const channelObj = channel.toObject();
    channelObj.ratingsCount = ratingCount;

    res.json(channelObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/tv-channels', async (req, res) => {
  const channel = new TVChannel(req.body);
  try {
    const newChannel = await channel.save();
    res.status(201).json(newChannel);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/tv-channels/:id', async (req, res) => {
  try {
    const channel = await TVChannel.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(channel);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/tv-channels/:id', async (req, res) => {
  try {
    await TVChannel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Channel deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Actor Routes
app.get('/api/actors', async (req, res) => {
  try {
    const actors = await Actor.find().sort({ createdAt: -1 });
    res.json(actors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/actors/:id', async (req, res) => {
  try {
    const actor = await Actor.findById(req.params.id);
    if (!actor) return res.status(404).json({ message: 'Actor not found' });
    res.json(actor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/actors', async (req, res) => {
  try {
    const actor = new Actor(req.body);
    await actor.save();
    res.status(201).json(actor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/actors/:id', async (req, res) => {
  try {
    const actor = await Actor.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(actor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/actors/:id', async (req, res) => {
  try {
    await Actor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Actor deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Director Routes
app.get('/api/directors', async (req, res) => {
  try {
    const directors = await Director.find().sort({ name: 1 });
    res.json(directors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/directors/:id', async (req, res) => {
  try {
    const director = await Director.findById(req.params.id);
    if (!director) return res.status(404).json({ message: 'Director not found' });
    res.json(director);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/directors', async (req, res) => {
  try {
    const director = new Director(req.body);
    await director.save();
    res.status(201).json(director);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/directors/:id', async (req, res) => {
  try {
    const director = await Director.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(director);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/directors/:id', async (req, res) => {
  try {
    await Director.findByIdAndDelete(req.params.id);
    res.json({ message: 'Director deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Slider Routes
app.get('/api/sliders', async (req, res) => {
  console.log('GET /api/sliders request received');
  try {
    // Aggressive timeout and lean query to handle large payloads
    const sliders = await Slider.find()
      .sort({ createdAt: -1 })
      .maxTimeMS(20000) // Increase to 20s
      .lean()
      .exec();
    
    res.json(sliders);
  } catch (err) {
    console.error('Error fetching sliders:', err);
    // If it's a timeout, return a more helpful message
    if (err.name === 'MongoNetworkTimeoutError' || err.name === 'MongooseError' && err.message.includes('timeout')) {
       return res.status(504).json({ message: 'Database connection timed out. Content might be too large.' });
    }
    res.status(500).json({ message: 'Error fetching sliders' });
  }
});

app.get('/api/sliders/:id', async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    res.json(slider);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/sliders', async (req, res) => {
  try {
    console.log('Received POST /api/sliders request with body:', req.body);
    const slider = new Slider(req.body);
    await slider.save();
    console.log('Successfully saved slider:', slider._id);
    res.status(201).json(slider);
  } catch (err) {
    console.error('Error saving slider:', err);
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/sliders/:id', async (req, res) => {
  try {
    const slider = await Slider.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(slider);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/sliders/:id', async (req, res) => {
  try {
    await Slider.findByIdAndDelete(req.params.id);
    res.json({ message: 'Slider deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Global Search Endpoint — searches across all content types
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }
    const regex = new RegExp(q.trim(), 'i');
    const filter = { status: 'Active', $or: [{ title: regex }, { description: regex }] };

    const [movies, shows, sports, newReleases, menuSettings] = await Promise.all([
      Movie.find(filter).limit(10).lean(),
      Show.find(filter).limit(10).lean(),
      SportsVideo.find({ status: 'Active', $or: [{ title: regex }, { description: regex }] }).limit(5).lean(),
      NewRelease.find(filter).limit(5).lean(),
      MenuSettings.findOne().lean(),
    ]);

    let filteredMovies = movies;
    let filteredShows = shows;
    let filteredSports = sports;
    let filteredNewReleases = newReleases;

    if (menuSettings) {
      const moviesOff = menuSettings.movies?.toUpperCase() === 'OFF';
      const shortFilmsOff = menuSettings.shortFilms?.toUpperCase() === 'OFF';
      const showsOff = menuSettings.shows?.toUpperCase() === 'OFF';
      const webSeriesOff = menuSettings.webSeries?.toUpperCase() === 'OFF';
      const sportsOff = menuSettings.sports?.toUpperCase() === 'OFF';

      if (moviesOff && shortFilmsOff) {
        filteredMovies = [];
      } else if (moviesOff) {
        filteredMovies = movies.filter(m => m.contentType === 'Short Film' || m.contentType === 'short-film');
      } else if (shortFilmsOff) {
        filteredMovies = movies.filter(m => m.contentType !== 'Short Film' && m.contentType !== 'short-film');
      }

      if (showsOff && webSeriesOff) {
        filteredShows = [];
      } else if (showsOff) {
        filteredShows = shows.filter(s => s.contentType === 'Short Web Series' || s.contentType === 'Short Web-Series');
      } else if (webSeriesOff) {
        filteredShows = shows.filter(s => s.contentType !== 'Short Web Series' && s.contentType !== 'Short Web-Series');
      }

      if (sportsOff) {
        filteredSports = [];
      }

      if (moviesOff) {
        filteredNewReleases = [];
      }
    }

    const results = [
      ...filteredMovies.map(m => ({ ...m, contentType: 'movie' })),
      ...filteredShows.map(s => ({ ...s, contentType: 'show' })),
      ...filteredNewReleases.map(n => ({ ...n, contentType: 'new-release' })),
      ...filteredSports.map(sp => ({ ...sp, contentType: 'sports' })),
    ];

    res.json(results);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Aggregated Home Data Route for Performance
app.get('/api/home-aggregated', async (req, res) => {
  try {
    const [
      sliders, movies, assets, experiences, shows, 
      newReleases, sports, channels, sportsCategories, settings, homeSections, menuSettings
    ] = await Promise.all([
      Slider.find({ status: 'Active' }).sort({ createdAt: -1 }).lean().maxTimeMS(5000),
      Movie.find({ status: 'Active' }).sort({ createdAt: -1 }).limit(20).lean().maxTimeMS(5000),
      Asset.find().lean().maxTimeMS(5000),
      Experience.find({ status: 'Active' }).sort({ order: 1 }).lean().maxTimeMS(5000),
      Show.find({ status: 'Active' }).sort({ createdAt: -1 }).limit(20).lean().maxTimeMS(5000),
      NewRelease.find({ status: 'Active' }).sort({ createdAt: -1 }).limit(20).lean().maxTimeMS(5000),
      SportsVideo.find({ status: 'Active' }).sort({ createdAt: -1 }).limit(20).lean().maxTimeMS(5000),
      TVChannel.find({ status: 'Active' }).sort({ createdAt: -1 }).limit(50).lean().maxTimeMS(5000),
      SportsCategory.find().lean().maxTimeMS(5000),
      GeneralSettings.findOne().lean().maxTimeMS(5000),
      HomeSection.find({ status: 'Active' }).sort({ order: 1 }).lean().maxTimeMS(5000),
      MenuSettings.findOne().lean().maxTimeMS(5000)
    ]);

    let filteredSliders = sliders;
    let filteredMovies = movies;
    let filteredShows = shows;
    let filteredNewReleases = newReleases;
    let filteredSports = sports;
    let filteredChannels = channels;

    if (menuSettings) {
      const moviesOff = menuSettings.movies?.toUpperCase() === 'OFF';
      const shortFilmsOff = menuSettings.shortFilms?.toUpperCase() === 'OFF';
      const showsOff = menuSettings.shows?.toUpperCase() === 'OFF';
      const webSeriesOff = menuSettings.webSeries?.toUpperCase() === 'OFF';
      const sportsOff = menuSettings.sports?.toUpperCase() === 'OFF';
      const liveTvOff = menuSettings.liveTv?.toUpperCase() === 'OFF';

      // Filter sliders
      filteredSliders = sliders.filter(slide => {
        const postType = slide.postType;
        if (postType === 'Movies' && moviesOff) return false;
        if (postType === 'TV Shows' && showsOff) return false;
        if (postType === 'Sports' && sportsOff) return false;
        if (postType === 'Live TV' && liveTvOff) return false;

        const contentType = slide.contentType;
        if (contentType === 'Movie' && moviesOff) return false;
        if (contentType === 'Short Film' && shortFilmsOff) return false;
        if (contentType === 'TV Show' && showsOff) return false;
        if (contentType === 'Short Web Series' && webSeriesOff) return false;
        if (contentType === 'Sports' && sportsOff) return false;
        if (contentType === 'Live TV' && liveTvOff) return false;
        return true;
      });

      // Filter movies
      if (moviesOff && shortFilmsOff) {
        filteredMovies = [];
      } else if (moviesOff) {
        filteredMovies = movies.filter(m => m.contentType === 'Short Film' || m.contentType === 'short-film');
      } else if (shortFilmsOff) {
        filteredMovies = movies.filter(m => m.contentType !== 'Short Film' && m.contentType !== 'short-film');
      }

      // Filter shows
      if (showsOff && webSeriesOff) {
        filteredShows = [];
      } else if (showsOff) {
        filteredShows = shows.filter(s => s.contentType === 'Short Web Series' || s.contentType === 'Short Web-Series' || s.contentType === 'web-series');
      } else if (webSeriesOff) {
        filteredShows = shows.filter(s => s.contentType !== 'Short Web Series' && s.contentType !== 'Short Web-Series' && s.contentType !== 'web-series');
      }

      // Filter newReleases
      if (moviesOff) {
        filteredNewReleases = [];
      }

      // Filter sports
      if (sportsOff) {
        filteredSports = [];
      }

      // Filter channels
      if (liveTvOff) {
        filteredChannels = [];
      }
    }

    res.json({
      sliders: filteredSliders,
      movies: filteredMovies,
      assets,
      experiences,
      shows: filteredShows,
      newReleases: filteredNewReleases,
      sports: filteredSports,
      channels: filteredChannels,
      sportsCategories,
      settings,
      homeSections,
      menuSettings
    });
  } catch (err) {
    console.error('Aggregated Home Error:', err);
    res.status(500).json({ message: 'Error fetching combined home data' });
  }
});

const seedSliders = async () => {
  try {
    const count = await Slider.countDocuments();
    if (count === 0) {
      const defaultSliders = [
        { 
          title: 'Future Hell', 
          image: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=1920&h=1080&fit=crop',
          status: 'Active'
        },
        { 
          title: 'The Dark Knight', 
          image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1920&h=1080&fit=crop',
          status: 'Active'
        },
        { 
          title: 'Interstellar', 
          image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1920&h=1080&fit=crop',
          status: 'Active'
        }
      ];
      await Slider.insertMany(defaultSliders);
      console.log('Default sliders seeded');
    }
  } catch (err) {
    console.error('Error seeding sliders:', err);
  }
};
// seedSliders();

const seedHomeSections = async () => {
  try {
    const count = await HomeSection.countDocuments();
    if (count === 0) {
      const defaultSections = [
        { title: 'NEW RELEASES', sectionType: 'Movie', layout: 'Slider', order: 1, limit: 15, status: 'Active' },
        { title: 'WATCH SHOWS ONLINE', sectionType: 'Shows', layout: 'Slider', order: 2, limit: 6, status: 'Active' },
        { title: 'BEST IN SPORTS', sectionType: 'Sports', layout: 'Slider', order: 3, limit: 15, status: 'Active' },
        { title: 'LIVE TV', sectionType: 'Live TV', layout: 'Slider', order: 4, limit: 50, status: 'Active' }
      ];
      await HomeSection.insertMany(defaultSections);
      console.log('Default Home Sections seeded');
    }
  } catch (err) {
    console.error('Error seeding home sections:', err);
  }
};

// Home Section Routes
app.get('/api/home-sections', async (req, res) => {
  try {
    const sections = await HomeSection.find().sort({ order: 1 });
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/home-sections', async (req, res) => {
  try {
    const section = new HomeSection(req.body);
    await section.save();
    res.status(201).json(section);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/home-sections/:id', async (req, res) => {
  try {
    const section = await HomeSection.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(section);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/home-sections/:id', async (req, res) => {
  try {
    await HomeSection.findByIdAndDelete(req.params.id);
    res.json({ message: 'Home section deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// User Routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin routes to terminate active user session(s)
app.post('/api/users/:id/sessions/terminate', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.activeSessions = (user.activeSessions || []).filter(s => s._id.toString() !== sessionId);
    await user.save();

    res.json({ message: 'Session terminated successfully', activeSessions: user.activeSessions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/users/:id/sessions/terminate-all', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.activeSessions = [];
    await user.save();

    res.json({ message: 'All sessions terminated successfully', activeSessions: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/users/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    res.json({ exists: !!user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/users/import', async (req, res) => {
  try {
    const { users } = req.body;
    if (!users || !Array.isArray(users)) {
      return res.status(400).json({ message: 'Users array is required' });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const item of users) {
      try {
        if (!item.Email && !item.email) {
          errorCount++;
          continue;
        }
        const email = (item.Email || item.email).trim().toLowerCase();
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errorCount++;
          continue;
        }

        const name = item.Name || item.name || email.split('@')[0];
        const phone = item.Phone || item.phone || '';
        const rawStatus = item.Status || item.status || 'Active';
        const status = (rawStatus === 'Blocked' || rawStatus === 'Inactive') ? 'Inactive' : 'Active';
        const subscriptionPlan = item['Subscription Plan'] || item.subscriptionPlan || 'Basic Plan';
        const expiryDate = item['Expiry Date'] || item.expiryDate || '2099-12-31';
        const role = (item.Role || item.role || 'customer').toLowerCase();
        const providedPassword = item.Password || item.password;
        const authProvider = item['Auth Provider'] || item.authProvider || 'Email';

        let user = await User.findOne({ email });
        if (user) {
          user.name = name;
          user.phone = phone;
          user.status = status;
          user.subscriptionPlan = subscriptionPlan;
          user.expiryDate = expiryDate;
          user.authProvider = authProvider;
          if (role) user.role = role;
          if (providedPassword && providedPassword !== user.password) {
            user.password = providedPassword;
          }
          await user.save();
          updatedCount++;
        } else {
          const passwordToUse = providedPassword || crypto.randomBytes(8).toString('hex');
          user = new User({
            email,
            name,
            password: passwordToUse,
            phone,
            status,
            subscriptionPlan,
            expiryDate,
            role,
            authProvider,
            isDeleted: false
          });
          await user.save();
          importedCount++;
        }
      } catch (err) {
        console.error('Import error for user item:', item, err);
        errorCount++;
      }
    }

    res.json({
      message: 'Bulk import completed',
      importedCount,
      updatedCount,
      errorCount
    });
  } catch (err) {
    console.error('[SERVER ERROR] POST /api/users/import:', err);
    res.status(500).json({ message: 'Server error during import' });
  }
});

// ==========================================
// CONTENT IMPORT & EXPORT SYSTEM ENDPOINTS
// ==========================================

// Helper function to process comma-separated names of Actors/Directors
async function processCastNames(castString, ModelClass) {
  if (!castString) return [];
  const names = castString.split(',').map(n => n.trim()).filter(Boolean);
  const ids = [];
  for (const name of names) {
    let doc = await ModelClass.findOne({ name: { $regex: new RegExp('^' + name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') } });
    if (!doc) {
      doc = new ModelClass({ name, status: 'Active' });
      await doc.save();
    }
    ids.push(doc._id);
  }
  return ids;
}

// GET /api/export/:type - Populates relations and returns clean json for export
app.get('/api/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    let data = [];

    if (type === 'movies') {
      const docs = await Movie.find({ contentType: { $ne: 'Short Film' } })
        .populate('actors', 'name')
        .populate('directors', 'name')
        .sort({ createdAt: -1 });
      data = docs.map(doc => ({
        ...doc.toObject(),
        actors: (doc.actors || []).map(a => a.name).join(', '),
        directors: (doc.directors || []).map(d => d.name).join(', ')
      }));
    } else if (type === 'short-films') {
      const docs = await Movie.find({ contentType: 'Short Film' })
        .populate('actors', 'name')
        .populate('directors', 'name')
        .sort({ createdAt: -1 });
      data = docs.map(doc => ({
        ...doc.toObject(),
        actors: (doc.actors || []).map(a => a.name).join(', '),
        directors: (doc.directors || []).map(d => d.name).join(', ')
      }));
    } else if (type === 'shows') {
      const docs = await Show.find({ contentType: { $ne: 'Short Web Series' } })
        .populate('actors', 'name')
        .populate('directors', 'name')
        .sort({ createdAt: -1 });
      data = docs.map(doc => ({
        ...doc.toObject(),
        actors: (doc.actors || []).map(a => a.name).join(', '),
        directors: (doc.directors || []).map(d => d.name).join(', ')
      }));
    } else if (type === 'short-web-series') {
      const docs = await Show.find({ contentType: 'Short Web Series' })
        .populate('actors', 'name')
        .populate('directors', 'name')
        .sort({ createdAt: -1 });
      data = docs.map(doc => ({
        ...doc.toObject(),
        actors: (doc.actors || []).map(a => a.name).join(', '),
        directors: (doc.directors || []).map(d => d.name).join(', ')
      }));
    } else if (type === 'new-releases') {
      const docs = await NewRelease.find()
        .populate('actors', 'name')
        .populate('directors', 'name')
        .sort({ createdAt: -1 });
      data = docs.map(doc => ({
        ...doc.toObject(),
        actors: (doc.actors || []).map(a => a.name).join(', '),
        directors: (doc.directors || []).map(d => d.name).join(', ')
      }));
    } else if (type === 'sports-videos') {
      const docs = await SportsVideo.find().populate('category', 'name').sort({ createdAt: -1 });
      data = docs.map(doc => ({
        ...doc.toObject(),
        category: doc.category ? doc.category.name : ''
      }));
    } else if (type === 'tv-channels') {
      const docs = await TVChannel.find().populate('category', 'name').sort({ createdAt: -1 });
      data = docs.map(doc => ({
        ...doc.toObject(),
        category: doc.category ? doc.category.name : ''
      }));
    } else if (type === 'seasons') {
      const docs = await Season.find().populate('showId', 'title').sort({ createdAt: -1 });
      data = docs.map(doc => ({
        ...doc.toObject(),
        showTitle: doc.showId ? doc.showId.title : doc.showName || ''
      }));
    } else if (type === 'episodes') {
      const docs = await Episode.find()
        .populate('showId', 'title')
        .populate('seasonId', 'title')
        .sort({ createdAt: -1 });
      data = docs.map(doc => ({
        ...doc.toObject(),
        showTitle: doc.showId ? doc.showId.title : '',
        seasonTitle: doc.seasonId ? doc.seasonId.title : ''
      }));
    } else if (type === 'actors') {
      const docs = await Actor.find().sort({ createdAt: -1 });
      data = docs.map(doc => doc.toObject());
    } else if (type === 'directors') {
      const docs = await Director.find().sort({ createdAt: -1 });
      data = docs.map(doc => doc.toObject());
    } else if (type === 'languages') {
      const docs = await Language.find().sort({ createdAt: -1 });
      data = docs.map(doc => doc.toObject());
    } else if (type === 'genres') {
      const docs = await Genre.find().sort({ createdAt: -1 });
      data = docs.map(doc => doc.toObject());
    } else if (type === 'coupons') {
      const docs = await Coupon.find().sort({ createdAt: -1 });
      data = docs.map(doc => doc.toObject());
    } else if (type === 'sliders') {
      const docs = await Slider.find().sort({ createdAt: -1 });
      data = docs.map(doc => {
        const obj = doc.toObject();
        if (Array.isArray(obj.displayOn)) {
          obj.displayOn = obj.displayOn.join(', ');
        }
        return obj;
      });
    } else if (type === 'experiences') {
      const docs = await Experience.find().sort({ order: 1 });
      data = docs.map(doc => doc.toObject());
    } else if (type === 'assets') {
      const docs = await Asset.find().sort({ createdAt: -1 });
      data = docs.map(doc => doc.toObject());
    } else if (type === 'home-sections') {
      const docs = await HomeSection.find().sort({ order: 1 });
      data = docs.map(doc => doc.toObject());
    } else if (type === 'subscription-plans') {
      const docs = await SubscriptionPlan.find().sort({ createdAt: -1 });
      data = docs.map(doc => doc.toObject());
    } else if (type === 'pages') {
      const docs = await Page.find().sort({ createdAt: -1 });
      data = docs.map(doc => doc.toObject());
    } else if (type === 'sub-admins') {
      const docs = await User.find({ role: { $in: ['sub-admin', 'admin'] }, isDeleted: false }).sort({ createdAt: -1 });
      data = docs.map(doc => {
        const obj = doc.toObject();
        delete obj.password;
        delete obj.resetToken;
        delete obj.resetTokenExpiry;
        delete obj.activeSessions;
        delete obj.deviceHistory;
        delete obj.watchlist;
        return obj;
      });
    } else {
      return res.status(400).json({ message: 'Invalid export type' });
    }

    // Clean up unnecessary fields for a clean export
    const cleanData = data.map(item => {
      const clean = { ...item };
      delete clean._id;
      delete clean.__v;
      delete clean.createdAt;
      delete clean.updatedAt;
      delete clean.showId;
      delete clean.seasonId;
      return clean;
    });

    res.json(cleanData);
  } catch (err) {
    console.error(`[SERVER ERROR] GET /api/export/${req.params.type}:`, err);
    res.status(500).json({ message: 'Server error during export' });
  }
});

// POST /api/movies/import - Import Movies or Short Films
app.post('/api/movies/import', async (req, res) => {
  try {
    const { movies, defaultContentType } = req.body;
    if (!movies || !Array.isArray(movies)) {
      return res.status(400).json({ message: 'Movies array is required' });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < movies.length; i++) {
      const item = movies[i];
      try {
        const title = item.title || item.Title;
        const language = item.language || item.Language;
        if (!title || !language) {
          errorCount++;
          errors.push(`Row ${i + 1}: Title and Language are required.`);
          continue;
        }

        const genresRaw = item.genres || item.Genres || item.genre || item.Genre || '';
        const genres = Array.isArray(genresRaw) 
          ? genresRaw 
          : genresRaw.split(',').map(g => g.trim()).filter(Boolean);

        const contentType = item.contentType || item.ContentType || defaultContentType || 'Movie';

        const actorNames = item.actors || item.Actors || '';
        const directorNames = item.directors || item.Directors || '';
        const actors = await processCastNames(actorNames, Actor);
        const directors = await processCastNames(directorNames, Director);

        // Find existing movie by title, language and contentType
        let movie = await Movie.findOne({ 
          title: { $regex: new RegExp('^' + title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
          language: { $regex: new RegExp('^' + language.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
          contentType 
        });

        const movieData = {
          title,
          language,
          contentType,
          genres,
          actors,
          directors,
          imdbId: item.imdbId || item.ImdbId || item.imdbID || '',
          description: item.description || item.Description || '',
          sortInfo: item.sortInfo || item.SortInfo || '',
          upcoming: item.upcoming || item.Upcoming || 'No',
          seriesAccess: item.seriesAccess || item.SeriesAccess || item.access || item.Access || 'Paid',
          access: item.access || item.Access || item.seriesAccess || item.SeriesAccess || 'Paid',
          imdbRating: item.imdbRating || item.ImdbRating || '',
          contentRating: item.contentRating || item.ContentRating || '16+',
          releaseDate: item.releaseDate || item.ReleaseDate ? new Date(item.releaseDate || item.ReleaseDate) : undefined,
          duration: item.duration || item.Duration || '',
          status: item.status || item.Status || 'Active',
          thumbnail: item.thumbnail || item.Thumbnail || '',
          poster: item.poster || item.Poster || '',
          trailerUrl: item.trailerUrl || item.TrailerUrl || '',
          videoType: item.videoType || item.VideoType || 'Local',
          videoQuality: item.videoQuality || item.VideoQuality || '8K Ultra HD',
          videoFile: item.videoFile || item.VideoFile || '',
          videoFile480: item.videoFile480 || item.VideoFile480 || '',
          videoFile720: item.videoFile720 || item.VideoFile720 || '',
          videoFile1080: item.videoFile1080 || item.VideoFile1080 || '',
          downloadable: item.downloadable || item.Downloadable || 'Inactive',
          downloadUrl: item.downloadUrl || item.DownloadUrl || '',
          seoTitle: item.seoTitle || item.SeoTitle || '',
          metaDescription: item.metaDescription || item.MetaDescription || '',
          keywords: item.keywords || item.Keywords || ''
        };

        if (movie) {
          Object.assign(movie, movieData);
          await movie.save();
          updatedCount++;
        } else {
          movie = new Movie(movieData);
          await movie.save();
          importedCount++;
        }
      } catch (err) {
        console.error('Error importing movie item:', item, err);
        errorCount++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      message: 'Movie import completed',
      importedCount,
      updatedCount,
      errorCount,
      errors
    });
  } catch (err) {
    console.error('[SERVER ERROR] POST /api/movies/import:', err);
    res.status(500).json({ message: 'Server error during import' });
  }
});

// POST /api/shows/import - Import Shows or Web Series
app.post('/api/shows/import', async (req, res) => {
  try {
    const { shows, defaultContentType } = req.body;
    if (!shows || !Array.isArray(shows)) {
      return res.status(400).json({ message: 'Shows array is required' });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < shows.length; i++) {
      const item = shows[i];
      try {
        const title = item.title || item.Title;
        const language = item.language || item.Language;
        if (!title || !language) {
          errorCount++;
          errors.push(`Row ${i + 1}: Title and Language are required.`);
          continue;
        }

        const genresRaw = item.genres || item.Genres || item.genre || item.Genre || '';
        const genres = Array.isArray(genresRaw) 
          ? genresRaw 
          : genresRaw.split(',').map(g => g.trim()).filter(Boolean);

        const contentType = item.contentType || item.ContentType || defaultContentType || 'TV Show';

        const actorNames = item.actors || item.Actors || '';
        const directorNames = item.directors || item.Directors || '';
        const actors = await processCastNames(actorNames, Actor);
        const directors = await processCastNames(directorNames, Director);

        // Find existing show by title, language and contentType
        let show = await Show.findOne({ 
          title: { $regex: new RegExp('^' + title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
          language: { $regex: new RegExp('^' + language.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
          contentType 
        });

        const showData = {
          title,
          language,
          contentType,
          genres,
          actors,
          directors,
          imdbId: item.imdbId || item.ImdbId || item.imdbID || '',
          description: item.description || item.Description || '',
          sortInfo: item.sortInfo || item.SortInfo || '',
          upcoming: item.upcoming || item.Upcoming || 'No',
          seriesAccess: item.seriesAccess || item.SeriesAccess || 'Paid',
          imdbRating: item.imdbRating || item.ImdbRating || '',
          contentRating: item.contentRating || item.ContentRating || '16+',
          releaseYear: item.releaseYear || item.ReleaseYear ? parseInt(item.releaseYear || item.ReleaseYear) : undefined,
          rating: item.rating || item.Rating || '4.8',
          status: item.status || item.Status || 'Active',
          thumbnail: item.thumbnail || item.Thumbnail || '',
          poster: item.poster || item.Poster || '',
          videoQuality: item.videoQuality || item.VideoQuality || '4K Ultra HD',
          seoTitle: item.seoTitle || item.SeoTitle || '',
          metaDescription: item.metaDescription || item.MetaDescription || '',
          keywords: item.keywords || item.Keywords || ''
        };

        if (show) {
          Object.assign(show, showData);
          await show.save();
          updatedCount++;
        } else {
          show = new Show(showData);
          await show.save();
          importedCount++;
        }
      } catch (err) {
        console.error('Error importing show item:', item, err);
        errorCount++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      message: 'Show import completed',
      importedCount,
      updatedCount,
      errorCount,
      errors
    });
  } catch (err) {
    console.error('[SERVER ERROR] POST /api/shows/import:', err);
    res.status(500).json({ message: 'Server error during import' });
  }
});

// POST /api/sports-videos/import - Import Sports Videos
app.post('/api/sports-videos/import', async (req, res) => {
  try {
    const { videos } = req.body;
    if (!videos || !Array.isArray(videos)) {
      return res.status(400).json({ message: 'Videos array is required' });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < videos.length; i++) {
      const item = videos[i];
      try {
        const title = item.title || item.Title;
        const categoryName = item.category || item.Category || item.categoryName || item.CategoryName;
        if (!title || !categoryName) {
          errorCount++;
          errors.push(`Row ${i + 1}: Title and Category are required.`);
          continue;
        }

        // Find or create category
        let categoryDoc = await SportsCategory.findOne({ name: { $regex: new RegExp('^' + categoryName.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') } });
        if (!categoryDoc) {
          categoryDoc = new SportsCategory({ name: categoryName.trim(), status: true });
          await categoryDoc.save();
        }

        let video = await SportsVideo.findOne({ 
          title: { $regex: new RegExp('^' + title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
          category: categoryDoc._id
        });

        const videoData = {
          title,
          category: categoryDoc._id,
          poster: item.poster || item.Poster || '',
          landscapePoster: item.landscapePoster || item.LandscapePoster || '',
          description: item.description || item.Description || '',
          access: item.access || item.Access || 'Paid',
          date: item.date || item.Date || '',
          duration: item.duration || item.Duration || '',
          status: item.status || item.Status || 'Active',
          videoType: item.videoType || item.VideoType || 'Local',
          videoQuality: item.videoQuality || item.VideoQuality || 'Active',
          videoFile: item.videoFile || item.VideoFile || '',
          videoFile480: item.videoFile480 || item.VideoFile480 || '',
          videoFile720: item.videoFile720 || item.VideoFile720 || '',
          videoFile1080: item.videoFile1080 || item.VideoFile1080 || '',
          downloadable: item.downloadable || item.Downloadable || 'Inactive',
          downloadUrl: item.downloadUrl || item.DownloadUrl || '',
          subtitlesActive: item.subtitlesActive || item.SubtitlesActive || 'Inactive',
          seoTitle: item.seoTitle || item.SeoTitle || '',
          metaDescription: item.metaDescription || item.MetaDescription || '',
          keywords: item.keywords || item.Keywords || ''
        };

        if (video) {
          Object.assign(video, videoData);
          await video.save();
          updatedCount++;
        } else {
          video = new SportsVideo(videoData);
          await video.save();
          importedCount++;
        }
      } catch (err) {
        console.error('Error importing sports video:', item, err);
        errorCount++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      message: 'Sports video import completed',
      importedCount,
      updatedCount,
      errorCount,
      errors
    });
  } catch (err) {
    console.error('[SERVER ERROR] POST /api/sports-videos/import:', err);
    res.status(500).json({ message: 'Server error during import' });
  }
});

// POST /api/new-releases/import - Import New Releases
app.post('/api/new-releases/import', async (req, res) => {
  try {
    const { releases } = req.body;
    if (!releases || !Array.isArray(releases)) {
      return res.status(400).json({ message: 'Releases array is required' });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < releases.length; i++) {
      const item = releases[i];
      try {
        const title = item.title || item.Title;
        const language = item.language || item.Language;
        if (!title || !language) {
          errorCount++;
          errors.push(`Row ${i + 1}: Title and Language are required.`);
          continue;
        }

        const genresRaw = item.genres || item.Genres || item.genre || item.Genre || '';
        const genres = Array.isArray(genresRaw) 
          ? genresRaw 
          : genresRaw.split(',').map(g => g.trim()).filter(Boolean);

        const actorNames = item.actors || item.Actors || '';
        const directorNames = item.directors || item.Directors || '';
        const actors = await processCastNames(actorNames, Actor);
        const directors = await processCastNames(directorNames, Director);

        let release = await NewRelease.findOne({ 
          title: { $regex: new RegExp('^' + title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
          language: { $regex: new RegExp('^' + language.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
        });

        const releaseData = {
          title,
          language,
          genres,
          actors,
          directors,
          description: item.description || item.Description || '',
          sortInfo: item.sortInfo || item.SortInfo || '',
          upcoming: item.upcoming || item.Upcoming || 'No',
          access: item.access || item.Access || 'Paid',
          imdbRating: item.imdbRating || item.ImdbRating || '',
          contentRating: item.contentRating || item.ContentRating || '16+',
          releaseYear: item.releaseYear || item.ReleaseYear ? parseInt(item.releaseYear || item.ReleaseYear) : undefined,
          duration: item.duration || item.Duration || '',
          poster: item.poster || item.Poster || '',
          thumbnail: item.thumbnail || item.Thumbnail || '',
          banner: item.banner || item.Banner || '',
          trailerUrl: item.trailerUrl || item.TrailerUrl || '',
          videoType: item.videoType || item.VideoType || 'Local',
          videoQuality: item.videoQuality || item.VideoQuality || '8K Ultra HD',
          videoFile: item.videoFile || item.VideoFile || '',
          videoFile480: item.videoFile480 || item.VideoFile480 || '',
          videoFile720: item.videoFile720 || item.VideoFile720 || '',
          videoFile1080: item.videoFile1080 || item.VideoFile1080 || '',
          subtitlesActive: item.subtitlesActive || item.SubtitlesActive || 'Inactive',
          status: item.status || item.Status || 'Active',
          seoTitle: item.seoTitle || item.SeoTitle || '',
          metaDescription: item.metaDescription || item.MetaDescription || '',
          keywords: item.keywords || item.Keywords || '',
          imdbId: item.imdbId || item.ImdbId || ''
        };

        if (release) {
          Object.assign(release, releaseData);
          await release.save();
          updatedCount++;
        } else {
          release = new NewRelease(releaseData);
          await release.save();
          importedCount++;
        }
      } catch (err) {
        console.error('Error importing new release:', item, err);
        errorCount++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      message: 'New release import completed',
      importedCount,
      updatedCount,
      errorCount,
      errors
    });
  } catch (err) {
    console.error('[SERVER ERROR] POST /api/new-releases/import:', err);
    res.status(500).json({ message: 'Server error during import' });
  }
});

// POST /api/tv-channels/import - Import TV Channels
app.post('/api/tv-channels/import', async (req, res) => {
  try {
    const { channels } = req.body;
    if (!channels || !Array.isArray(channels)) {
      return res.status(400).json({ message: 'Channels array is required' });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < channels.length; i++) {
      const item = channels[i];
      try {
        const name = item.name || item.Name;
        const categoryName = item.category || item.Category || item.categoryName || item.CategoryName;
        if (!name || !categoryName) {
          errorCount++;
          errors.push(`Row ${i + 1}: Name and Category are required.`);
          continue;
        }

        // Find or create category
        let categoryDoc = await TVCategory.findOne({ name: { $regex: new RegExp('^' + categoryName.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') } });
        if (!categoryDoc) {
          categoryDoc = new TVCategory({ name: categoryName.trim(), status: true });
          await categoryDoc.save();
        }

        let channel = await TVChannel.findOne({ 
          name: { $regex: new RegExp('^' + name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
          category: categoryDoc._id
        });

        const channelData = {
          name,
          category: categoryDoc._id,
          description: item.description || item.Description || '',
          tvAccess: item.tvAccess || item.TvAccess || item.access || item.Access || 'Paid',
          status: item.status || item.Status || 'Active',
          streamType: item.streamType || item.StreamType || 'HLS/m3u8 / MPEG-DASH / YouTube / Vimeo',
          server1Url: item.server1Url || item.Server1Url || '',
          server2Url: item.server2Url || item.Server2Url || '',
          server3Url: item.server3Url || item.Server3Url || '',
          embedCode: item.embedCode || item.EmbedCode || '',
          logo: item.logo || item.Logo || '',
          seoTitle: item.seoTitle || item.SeoTitle || '',
          metaDescription: item.metaDescription || item.MetaDescription || '',
          keywords: item.keywords || item.Keywords || ''
        };

        if (channel) {
          Object.assign(channel, channelData);
          await channel.save();
          updatedCount++;
        } else {
          channel = new TVChannel(channelData);
          await channel.save();
          importedCount++;
        }
      } catch (err) {
        console.error('Error importing TV channel:', item, err);
        errorCount++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      message: 'TV channel import completed',
      importedCount,
      updatedCount,
      errorCount,
      errors
    });
  } catch (err) {
    console.error('[SERVER ERROR] POST /api/tv-channels/import:', err);
    res.status(500).json({ message: 'Server error during import' });
  }
});

// POST /api/seasons/import - Import Seasons
app.post('/api/seasons/import', async (req, res) => {
  try {
    const { seasons } = req.body;
    if (!seasons || !Array.isArray(seasons)) {
      return res.status(400).json({ message: 'Seasons array is required' });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < seasons.length; i++) {
      const item = seasons[i];
      try {
        const title = item.title || item.Title;
        const showTitle = item.showTitle || item.ShowTitle || item.showName || item.ShowName;
        if (!title || !showTitle) {
          errorCount++;
          errors.push(`Row ${i + 1}: Title and Show Title are required.`);
          continue;
        }

        // Find show
        let showDoc = await Show.findOne({ title: { $regex: new RegExp('^' + showTitle.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') } });
        if (!showDoc) {
          errorCount++;
          errors.push(`Row ${i + 1}: Show "${showTitle}" not found. Please create the show first.`);
          continue;
        }

        let season = await Season.findOne({ 
          title: { $regex: new RegExp('^' + title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
          showId: showDoc._id
        });

        const seasonData = {
          title,
          showId: showDoc._id,
          showName: showDoc.title,
          status: item.status || item.Status || 'Active',
          poster: item.poster || item.Poster || '',
          thumbnail: item.thumbnail || item.Thumbnail || ''
        };

        if (season) {
          Object.assign(season, seasonData);
          await season.save();
          updatedCount++;
        } else {
          season = new Season(seasonData);
          await season.save();
          importedCount++;
        }
      } catch (err) {
        console.error('Error importing season:', item, err);
        errorCount++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      message: 'Season import completed',
      importedCount,
      updatedCount,
      errorCount,
      errors
    });
  } catch (err) {
    console.error('[SERVER ERROR] POST /api/seasons/import:', err);
    res.status(500).json({ message: 'Server error during import' });
  }
});

// POST /api/episodes/import - Import Episodes
app.post('/api/episodes/import', async (req, res) => {
  try {
    const { episodes } = req.body;
    if (!episodes || !Array.isArray(episodes)) {
      return res.status(400).json({ message: 'Episodes array is required' });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < episodes.length; i++) {
      const item = episodes[i];
      try {
        const title = item.title || item.Title;
        const showTitle = item.showTitle || item.ShowTitle || item.showName || item.ShowName;
        const seasonTitle = item.seasonTitle || item.SeasonTitle;
        if (!title || !showTitle) {
          errorCount++;
          errors.push(`Row ${i + 1}: Title and Show Title are required.`);
          continue;
        }

        // Find show
        let showDoc = await Show.findOne({ title: { $regex: new RegExp('^' + showTitle.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') } });
        if (!showDoc) {
          errorCount++;
          errors.push(`Row ${i + 1}: Show "${showTitle}" not found. Please create the show first.`);
          continue;
        }

        // Find or create season if seasonTitle is provided
        let seasonDoc = null;
        if (seasonTitle) {
          seasonDoc = await Season.findOne({ 
            title: { $regex: new RegExp('^' + seasonTitle.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
            showId: showDoc._id
          });
          if (!seasonDoc) {
            // Create a new season automatically if not found
            seasonDoc = new Season({
              title: seasonTitle.trim(),
              showId: showDoc._id,
              showName: showDoc.title,
              status: 'Active'
            });
            await seasonDoc.save();
          }
        }

        let query = { 
          title: { $regex: new RegExp('^' + title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
          showId: showDoc._id
        };
        if (seasonDoc) {
          query.seasonId = seasonDoc._id;
        }

        let episode = await Episode.findOne(query);

        const episodeData = {
          title,
          showId: showDoc._id,
          seasonId: seasonDoc ? seasonDoc._id : undefined,
          imdbId: item.imdbId || item.ImdbId || '',
          description: item.description || item.Description || '',
          access: item.access || item.Access || 'Paid',
          imdbRating: item.imdbRating || item.ImdbRating || '',
          releaseDate: item.releaseDate || item.ReleaseDate ? new Date(item.releaseDate || item.ReleaseDate) : undefined,
          duration: item.duration || item.Duration || '',
          status: item.status || item.Status || 'Active',
          poster: item.poster || item.Poster || '',
          videoType: item.videoType || item.VideoType || 'Local',
          videoQuality: item.videoQuality || item.VideoQuality || 'Active',
          videoFile: item.videoFile || item.VideoFile || '',
          videoFile480: item.videoFile480 || item.VideoFile480 || '',
          videoFile720: item.videoFile720 || item.VideoFile720 || '',
          videoFile1080: item.videoFile1080 || item.VideoFile1080 || '',
          downloadable: item.downloadable || item.Downloadable || 'Inactive',
          downloadUrl: item.downloadUrl || item.DownloadUrl || '',
          subtitlesActive: item.subtitlesActive || item.SubtitlesActive || 'Inactive',
          seoTitle: item.seoTitle || item.SeoTitle || '',
          metaDescription: item.metaDescription || item.MetaDescription || '',
          keywords: item.keywords || item.Keywords || ''
        };

        if (episode) {
          Object.assign(episode, episodeData);
          await episode.save();
          updatedCount++;
        } else {
          episode = new Episode(episodeData);
          await episode.save();
          importedCount++;
        }
      } catch (err) {
        console.error('Error importing episode:', item, err);
        errorCount++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      message: 'Episode import completed',
      importedCount,
      updatedCount,
      errorCount,
      errors
    });
  } catch (err) {
    console.error('[SERVER ERROR] POST /api/episodes/import:', err);
    res.status(500).json({ message: 'Server error during import' });
  }
});

// POST /api/actors/import - Import Actors
app.post('/api/actors/import', async (req, res) => {
  try {
    const { actors } = req.body;
    if (!actors || !Array.isArray(actors)) {
      return res.status(400).json({ message: 'Actors array is required' });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < actors.length; i++) {
      const item = actors[i];
      try {
        const name = item.name || item.Name;
        if (!name) {
          errorCount++;
          errors.push(`Row ${i + 1}: Name is required.`);
          continue;
        }

        let actor = await Actor.findOne({ 
          name: { $regex: new RegExp('^' + name.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
        });

        const actorData = {
          name: name.trim(),
          bio: item.bio || item.Bio || '',
          placeOfBirth: item.placeOfBirth || item.PlaceOfBirth || item.place_of_birth || '',
          birthday: item.birthday || item.Birthday || '',
          image: item.image || item.Image || '',
          status: item.status || item.Status || 'Active'
        };

        if (actor) {
          Object.assign(actor, actorData);
          await actor.save();
          updatedCount++;
        } else {
          actor = new Actor(actorData);
          await actor.save();
          importedCount++;
        }
      } catch (err) {
        console.error('Error importing actor:', item, err);
        errorCount++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      message: 'Actors import completed',
      importedCount,
      updatedCount,
      errorCount,
      errors
    });
  } catch (err) {
    console.error('[SERVER ERROR] POST /api/actors/import:', err);
    res.status(500).json({ message: 'Server error during import' });
  }
});

// POST /api/directors/import - Import Directors
app.post('/api/directors/import', async (req, res) => {
  try {
    const { directors } = req.body;
    if (!directors || !Array.isArray(directors)) {
      return res.status(400).json({ message: 'Directors array is required' });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < directors.length; i++) {
      const item = directors[i];
      try {
        const name = item.name || item.Name;
        if (!name) {
          errorCount++;
          errors.push(`Row ${i + 1}: Name is required.`);
          continue;
        }

        let director = await Director.findOne({ 
          name: { $regex: new RegExp('^' + name.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
        });

        const directorData = {
          name: name.trim(),
          bio: item.bio || item.Bio || '',
          placeOfBirth: item.placeOfBirth || item.PlaceOfBirth || item.place_of_birth || '',
          birthday: item.birthday || item.Birthday || '',
          image: item.image || item.Image || '',
          status: item.status || item.Status || 'Active'
        };

        if (director) {
          Object.assign(director, directorData);
          await director.save();
          updatedCount++;
        } else {
          director = new Director(directorData);
          await director.save();
          importedCount++;
        }
      } catch (err) {
        console.error('Error importing director:', item, err);
        errorCount++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      message: 'Directors import completed',
      importedCount,
      updatedCount,
      errorCount,
      errors
    });
  } catch (err) {
    console.error('[SERVER ERROR] POST /api/directors/import:', err);
    res.status(500).json({ message: 'Server error during import' });
  }
});

// POST /api/languages/import - Import Languages
app.post('/api/languages/import', async (req, res) => {
  try {
    const { languages } = req.body;
    if (!languages || !Array.isArray(languages)) {
      return res.status(400).json({ message: 'Languages array is required' });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < languages.length; i++) {
      const item = languages[i];
      try {
        const name = item.name || item.Name;
        if (!name) {
          errorCount++;
          errors.push(`Row ${i + 1}: Name is required.`);
          continue;
        }

        let status = true;
        if (item.hasOwnProperty('status') || item.hasOwnProperty('Status')) {
          const val = item.hasOwnProperty('status') ? item.status : item.Status;
          status = String(val).toLowerCase() === 'true' || String(val) === '1' || String(val).toLowerCase() === 'active';
        }

        let lang = await Language.findOne({ 
          name: { $regex: new RegExp('^' + name.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
        });

        if (lang) {
          lang.status = status;
          await lang.save();
          updatedCount++;
        } else {
          lang = new Language({
            name: name.trim(),
            status
          });
          await lang.save();
          importedCount++;
        }
      } catch (err) {
        console.error('Error importing language:', item, err);
        errorCount++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      message: 'Language import completed',
      importedCount,
      updatedCount,
      errorCount,
      errors
    });
  } catch (err) {
    console.error('[SERVER ERROR] POST /api/languages/import:', err);
    res.status(500).json({ message: 'Server error during import' });
  }
});

// POST /api/genres/import - Import Genres
app.post('/api/genres/import', async (req, res) => {
  try {
    const { genres } = req.body;
    if (!genres || !Array.isArray(genres)) {
      return res.status(400).json({ message: 'Genres array is required' });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < genres.length; i++) {
      const item = genres[i];
      try {
        const name = item.name || item.Name;
        if (!name) {
          errorCount++;
          errors.push(`Row ${i + 1}: Name is required.`);
          continue;
        }

        let status = true;
        if (item.hasOwnProperty('status') || item.hasOwnProperty('Status')) {
          const val = item.hasOwnProperty('status') ? item.status : item.Status;
          status = String(val).toLowerCase() === 'true' || String(val) === '1' || String(val).toLowerCase() === 'active';
        }

        let genre = await Genre.findOne({ 
          name: { $regex: new RegExp('^' + name.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
        });

        if (genre) {
          genre.status = status;
          await genre.save();
          updatedCount++;
        } else {
          genre = new Genre({
            name: name.trim(),
            status
          });
          await genre.save();
          importedCount++;
        }
      } catch (err) {
        console.error('Error importing genre:', item, err);
        errorCount++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      message: 'Genre import completed',
      importedCount,
      updatedCount,
      errorCount,
      errors
    });
  } catch (err) {
    console.error('[SERVER ERROR] POST /api/genres/import:', err);
    res.status(500).json({ message: 'Server error during import' });
  }
});

// POST /api/coupons/import - Import Coupons
app.post('/api/coupons/import', async (req, res) => {
  try {
    const { coupons } = req.body;
    if (!coupons || !Array.isArray(coupons)) {
      return res.status(400).json({ message: 'Coupons array is required' });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < coupons.length; i++) {
      const item = coupons[i];
      try {
        const couponCode = item.couponCode || item.CouponCode || item.couponcode || item.Couponcode;
        const couponPercentage = Number(item.couponPercentage || item.CouponPercentage || 0);
        const usersAllow = Number(item.usersAllow || item.UsersAllow || 0);
        const expiryDate = item.expiryDate || item.ExpiryDate || '';

        if (!couponCode || !couponPercentage || !usersAllow || !expiryDate) {
          errorCount++;
          errors.push(`Row ${i + 1}: Coupon Code, Percentage, Users Allow, and Expiry Date are required.`);
          continue;
        }

        let coupon = await Coupon.findOne({ couponCode: String(couponCode).trim() });

        const couponData = {
          couponCode: String(couponCode).trim(),
          couponPercentage,
          usersAllow,
          couponUsed: Number(item.couponUsed || item.CouponUsed || 0),
          expiryDate: String(expiryDate).trim(),
          status: item.status || item.Status || 'Active',
          showOnFrontend: item.showOnFrontend || item.ShowOnFrontend || 'ON'
        };

        if (coupon) {
          Object.assign(coupon, couponData);
          await coupon.save();
          updatedCount++;
        } else {
          coupon = new Coupon(couponData);
          await coupon.save();
          importedCount++;
        }
      } catch (err) {
        console.error('Error importing coupon:', item, err);
        errorCount++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      message: 'Coupons import completed',
      importedCount,
      updatedCount,
      errorCount,
      errors
    });
  } catch (err) {
    console.error('[SERVER ERROR] POST /api/coupons/import:', err);
    res.status(500).json({ message: 'Server error during import' });
  }
});

// POST /api/sliders/import - Import Sliders
app.post('/api/sliders/import', async (req, res) => {
  try {
    const { sliders } = req.body;
    if (!sliders || !Array.isArray(sliders)) {
      return res.status(400).json({ message: 'Sliders array is required' });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < sliders.length; i++) {
      const item = sliders[i];
      try {
        const title = String(item.title || item.Title || '').trim();
        const section = String(item.section || item.Section || 'Main Slider').trim();
        if (!title) {
          errorCount++;
          errors.push(`Row ${i + 1}: Title is required.`);
          continue;
        }

        let displayOn = ['Home'];
        if (item.hasOwnProperty('displayOn') || item.hasOwnProperty('DisplayOn')) {
          const rawVal = item.displayOn || item.DisplayOn;
          if (typeof rawVal === 'string') {
            displayOn = rawVal.split(',').map(s => s.trim()).filter(Boolean);
          } else if (Array.isArray(rawVal)) {
            displayOn = rawVal.map(s => String(s).trim()).filter(Boolean);
          }
        }

        let slider = await Slider.findOne({
          title: { $regex: new RegExp('^' + title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
          section: { $regex: new RegExp('^' + section.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
        });

        const sliderData = {
          title,
          image: String(item.image || item.Image || ''),
          contentType: String(item.contentType || item.ContentType || 'Image'),
          videoUrl: String(item.videoUrl || item.VideoUrl || ''),
          section,
          postType: String(item.postType || item.PostType || ''),
          contentId: String(item.contentId || item.ContentId || ''),
          displayOn,
          imdbRating: String(item.imdbRating || item.ImdbRating || ''),
          releaseYear: String(item.releaseYear || item.ReleaseYear || ''),
          duration: String(item.duration || item.Duration || ''),
          videoQuality: String(item.videoQuality || item.VideoQuality || '8K Ultra HD'),
          ccActive: String(item.ccActive || item.CcActive || 'Yes'),
          status: String(item.status || item.Status || 'Active'),
          link: String(item.link || item.Link || '')
        };

        if (slider) {
          Object.assign(slider, sliderData);
          await slider.save();
          updatedCount++;
        } else {
          slider = new Slider(sliderData);
          await slider.save();
          importedCount++;
        }
      } catch (err) {
        console.error('Error importing slider:', item, err);
        errorCount++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      message: 'Sliders import completed',
      importedCount,
      updatedCount,
      errorCount,
      errors
    });
  } catch (err) {
    console.error('[SERVER ERROR] POST /api/sliders/import:', err);
    res.status(500).json({ message: 'Server error during import' });
  }
});

// POST /api/experiences/import - Import Experiences
app.post('/api/experiences/import', async (req, res) => {
  try {
    const { experiences } = req.body;
    if (!experiences || !Array.isArray(experiences)) {
      return res.status(400).json({ message: 'Experiences array is required' });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < experiences.length; i++) {
      const item = experiences[i];
      try {
        const title = String(item.title || item.Title || '').trim();
        const description = String(item.description || item.Description || '').trim();
        if (!title || !description) {
          errorCount++;
          errors.push(`Row ${i + 1}: Title and Description are required.`);
          continue;
        }

        let exp = await Experience.findOne({
          title: { $regex: new RegExp('^' + title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
        });

        const expData = {
          title,
          description,
          icon: String(item.icon || item.Icon || 'Globe'),
          order: Number(item.order || item.Order || 0),
          status: String(item.status || item.Status || 'Active')
        };

        if (exp) {
          Object.assign(exp, expData);
          await exp.save();
          updatedCount++;
        } else {
          exp = new Experience(expData);
          await exp.save();
          importedCount++;
        }
      } catch (err) {
        console.error('Error importing experience:', item, err);
        errorCount++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      message: 'Experiences import completed',
      importedCount,
      updatedCount,
      errorCount,
      errors
    });
  } catch (err) {
    console.error('[SERVER ERROR] POST /api/experiences/import:', err);
    res.status(500).json({ message: 'Server error during import' });
  }
});

// POST /api/assets/import - Import Assets (Images)
app.post('/api/assets/import', async (req, res) => {
  try {
    const { assets } = req.body;
    if (!assets || !Array.isArray(assets)) {
      return res.status(400).json({ message: 'Assets array is required' });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < assets.length; i++) {
      const item = assets[i];
      try {
        const title = String(item.title || item.Title || '').trim();
        const url = String(item.url || item.Url || '').trim();
        if (!title || !url) {
          errorCount++;
          errors.push(`Row ${i + 1}: Title and URL are required.`);
          continue;
        }

        let asset = await Asset.findOne({ url });

        const assetData = {
          title,
          url,
          size: String(item.size || item.Size || ''),
          dimension: String(item.dimension || item.Dimension || 'Original'),
          date: String(item.date || item.Date || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }))
        };

        if (asset) {
          Object.assign(asset, assetData);
          await asset.save();
          updatedCount++;
        } else {
          asset = new Asset(assetData);
          await asset.save();
          importedCount++;
        }
      } catch (err) {
        console.error('Error importing asset:', item, err);
        errorCount++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      message: 'Assets import completed',
      importedCount,
      updatedCount,
      errorCount,
      errors
    });
  } catch (err) {
    console.error('[SERVER ERROR] POST /api/assets/import:', err);
    res.status(500).json({ message: 'Server error during import' });
  }
});

// POST /api/home-sections/import - Import Home Sections
app.post('/api/home-sections/import', async (req, res) => {
  try {
    const { 'home-sections': homeSections } = req.body;
    const list = homeSections || req.body.homeSections || req.body.sections;
    if (!list || !Array.isArray(list)) {
      return res.status(400).json({ message: 'Home Sections array is required' });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      try {
        const title = String(item.title || item.Title || '').trim();
        if (!title) {
          errorCount++;
          errors.push(`Row ${i + 1}: Title is required.`);
          continue;
        }

        let hs = await HomeSection.findOne({
          title: { $regex: new RegExp('^' + title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
        });

        const hsData = {
          title,
          sectionType: String(item.sectionType || item.SectionType || ''),
          layout: String(item.layout || item.Layout || 'Slider'),
          limit: Number(item.limit || item.Limit || 10),
          status: String(item.status || item.Status || 'Active'),
          order: Number(item.order || item.Order || 0)
        };

        if (hs) {
          Object.assign(hs, hsData);
          await hs.save();
          updatedCount++;
        } else {
          hs = new HomeSection(hsData);
          await hs.save();
          importedCount++;
        }
      } catch (err) {
        console.error('Error importing home section:', item, err);
        errorCount++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      message: 'Home Sections import completed',
      importedCount,
      updatedCount,
      errorCount,
      errors
    });
  } catch (err) {
    console.error('[SERVER ERROR] POST /api/home-sections/import:', err);
    res.status(500).json({ message: 'Server error during import' });
  }
});

// POST /api/subscription-plans/import - Import Subscription Plans
app.post('/api/subscription-plans/import', async (req, res) => {
  try {
    const { 'subscription-plans': subscriptionPlans } = req.body;
    const list = subscriptionPlans || req.body.subscriptionPlans || req.body.plans;
    if (!list || !Array.isArray(list)) {
      return res.status(400).json({ message: 'Subscription plans array is required' });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      try {
        const planName = String(item.planName || item.PlanName || item.planname || '').trim();
        if (!planName) {
          errorCount++;
          errors.push(`Row ${i + 1}: Plan Name is required.`);
          continue;
        }

        let plan = await SubscriptionPlan.findOne({
          planName: { $regex: new RegExp('^' + planName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
        });

        const planData = {
          planName,
          duration: String(item.duration || item.Duration || '1 Month'),
          price: String(item.price || item.Price || '0'),
          deviceLimit: String(item.deviceLimit || item.DeviceLimit || '1'),
          ads: String(item.ads || item.Ads || 'OFF'),
          streamingQuality: String(item.streamingQuality || item.StreamingQuality || 'HD'),
          status: String(item.status || item.Status || 'Active'),
          getStarted: String(item.getStarted || item.GetStarted || 'ON')
        };

        if (plan) {
          Object.assign(plan, planData);
          await plan.save();
          updatedCount++;
        } else {
          plan = new SubscriptionPlan(planData);
          await plan.save();
          importedCount++;
        }
      } catch (err) {
        console.error('Error importing subscription plan:', item, err);
        errorCount++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      message: 'Subscription plans import completed',
      importedCount,
      updatedCount,
      errorCount,
      errors
    });
  } catch (err) {
    console.error('[SERVER ERROR] POST /api/subscription-plans/import:', err);
    res.status(500).json({ message: 'Server error during import' });
  }
});

// POST /api/pages/import - Import Pages
app.post('/api/pages/import', async (req, res) => {
  try {
    const { pages } = req.body;
    if (!pages || !Array.isArray(pages)) {
      return res.status(400).json({ message: 'Pages array is required' });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < pages.length; i++) {
      const item = pages[i];
      try {
        const title = String(item.title || item.Title || '').trim();
        const slug = String(item.slug || item.Slug || '').trim();
        if (!title || !slug) {
          errorCount++;
          errors.push(`Row ${i + 1}: Title and Slug are required.`);
          continue;
        }

        let page = await Page.findOne({ slug: slug.toLowerCase() });

        const pageData = {
          title,
          slug: slug.toLowerCase(),
          content: String(item.content || item.Content || ''),
          status: String(item.status || item.Status || 'Active')
        };

        if (page) {
          Object.assign(page, pageData);
          await page.save();
          updatedCount++;
        } else {
          page = new Page(pageData);
          await page.save();
          importedCount++;
        }
      } catch (err) {
        console.error('Error importing page:', item, err);
        errorCount++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      message: 'Pages import completed',
      importedCount,
      updatedCount,
      errorCount,
      errors
    });
  } catch (err) {
    console.error('[SERVER ERROR] POST /api/pages/import:', err);
    res.status(500).json({ message: 'Server error during import' });
  }
});

// POST /api/sub-admins/import - Import Sub Admins
app.post('/api/sub-admins/import', async (req, res) => {
  try {
    const { 'sub-admins': subAdmins } = req.body;
    const list = subAdmins || req.body.subAdmins || req.body.users;
    if (!list || !Array.isArray(list)) {
      return res.status(400).json({ message: 'Sub-Admins array is required' });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      try {
        const email = String(item.email || item.Email || '').trim().toLowerCase();
        if (!email) {
          errorCount++;
          errors.push(`Row ${i + 1}: Email is required.`);
          continue;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errorCount++;
          errors.push(`Row ${i + 1}: Invalid email address.`);
          continue;
        }

        const name = String(item.name || item.Name || email.split('@')[0]).trim();
        const phone = String(item.phone || item.Phone || '').trim();
        const status = String(item.status || item.Status || 'Active').trim();
        const providedPassword = String(item.password || item.Password || '').trim();
        const role = String(item.role || item.Role || 'sub-admin').toLowerCase().trim();

        let user = await User.findOne({ email });
        if (user) {
          user.name = name;
          user.phone = phone;
          user.status = status;
          user.role = role;
          if (providedPassword && providedPassword !== user.password) {
            user.password = providedPassword;
          }
          await user.save();
          updatedCount++;
        } else {
          const passwordToUse = providedPassword || require('crypto').randomBytes(8).toString('hex');
          user = new User({
            email,
            name,
            password: passwordToUse,
            phone,
            status,
            role,
            subscriptionPlan: 'Basic Plan',
            expiryDate: '2099-12-31',
            authProvider: 'Email',
            isDeleted: false
          });
          await user.save();
          importedCount++;
        }
      } catch (err) {
        console.error('Error importing sub-admin:', item, err);
        errorCount++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      message: 'Sub Admin import completed',
      importedCount,
      updatedCount,
      errorCount,
      errors
    });
  } catch (err) {
    console.error('[SERVER ERROR] POST /api/sub-admins/import:', err);
    res.status(500).json({ message: 'Server error during import' });
  }
});

app.post('/api/users', upload.single('profileImage'), async (req, res) => {
  try {
    const { name, email, password, phone, role, status } = req.body;
    console.log('[DEBUG] Creating new user:', email);
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const userData = {
      name,
      email,
      password, // Will be hashed by pre-save hook
      phone,
      role: role || 'customer',
      status: status || 'Active',
      isDeleted: false
    };

    if (req.file) {
      console.log('[DEBUG] Image received:', req.file.path);
      userData.profileImage = req.file.path;
    }

    const user = new User(userData);
    await user.save();
    console.log('[DEBUG] User created successfully');
    res.status(201).json(user);
  } catch (err) {
    console.error('[SERVER ERROR] POST /api/users:', err);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
});

app.put('/api/users/:id', upload.single('profileImage'), async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[DEBUG] Updating user ${req.params.id}`);

    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const updateData = { ...req.body };
    
    // Clear active sessions if user is blocked
    if (updateData.status === 'Inactive') {
      updateData.activeSessions = [];
    }
    
    // Handle password hashing manually since findByIdAndUpdate doesn't trigger pre('save') hooks easily
    if (password && password.trim() !== '') {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(password, 10);
    } else {
      delete updateData.password;
    }

    if (req.file) {
      updateData.profileImage = req.file.path;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      { $set: updateData }, 
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('[DEBUG] User updated successfully');
    res.json(updatedUser);
  } catch (err) {
    console.error('[SERVER ERROR] PUT /api/users/:id:', err);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
});

app.post('/api/users/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No user IDs provided' });
    }
    await User.updateMany({ _id: { $in: ids } }, { isDeleted: true });
    res.json({ message: 'Users deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    // Soft delete
    await User.findByIdAndUpdate(req.params.id, { isDeleted: true }, { returnDocument: 'after' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/users/permanent/all', async (req, res) => {
  try {
    const result = await User.deleteMany({ isDeleted: true });
    res.json({ message: `${result.deletedCount} users permanently deleted` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/users/permanent/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User permanently deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/contents/:type/:id/view', async (req, res) => {
  const { type, id } = req.params;
  try {
    let model;
    const normalizedType = type.toLowerCase().trim();
    if (normalizedType === 'movies' || normalizedType === 'movie' || normalizedType === 'short-film') {
      model = Movie;
    } else if (normalizedType === 'shows' || normalizedType === 'show' || normalizedType === 'series' || normalizedType === 'short-web-series') {
      model = Show;
    } else if (normalizedType === 'new-releases' || normalizedType === 'new-release') {
      model = NewRelease;
    } else if (normalizedType === 'tv-channels' || normalizedType === 'tv-channel' || normalizedType === 'live') {
      model = TVChannel;
    } else if (normalizedType === 'sports-videos' || normalizedType === 'sports' || normalizedType === 'sport') {
      model = SportsVideo;
    }

    if (!model) {
      return res.status(400).json({ message: 'Invalid content type' });
    }

    const updated = await model.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { returnDocument: 'after' }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Content not found' });
    }
    res.json({ success: true, views: updated.views });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../client/dist')));

// Anything that doesn't match an API route, send back the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Global Error Handler for Multer and other errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('[MULTER ERROR]:', err);
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  console.error('[GLOBAL ERROR]:', err);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// Server is started inside connectDB()

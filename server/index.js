const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5001;

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
  secret: { type: String, default: 'viaviweb' }
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
const { upload } = require('./cloudinaryConfig');
const { uploadToMux, getPlaybackPolicyCached, signPlaybackId } = require('./muxService');
const multer = require('multer');

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

// Upload Route - wraps multer to catch Cloudinary/middleware errors
app.post('/api/upload', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      console.error('Upload middleware error:', err);
      return res.status(500).json({ message: err.message || 'File upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let fileUrl = req.file.path;
    const isVideo = req.file.mimetype.startsWith('video/') || req.file.originalname.match(/\.(mp4|mkv|webm|avi|mov)$/i);

    if (isVideo && process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET) {
      try {
        console.log(`Video detected: ${req.file.originalname}. Ingesting to Mux...`);
        const muxUrl = await uploadToMux(fileUrl);
        if (muxUrl) {
          console.log(`Mux playback URL created: ${muxUrl}`);
          fileUrl = muxUrl;
        }
      } catch (muxErr) {
        console.error('Mux ingestion failed, falling back to Cloudinary URL:', muxErr.message);
      }
    } else {
      console.log('File uploaded to Cloudinary:', fileUrl);
    }

    res.json({ url: fileUrl });
  });
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
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
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
    if (user.status !== 'Active') {
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
      if (user.status !== 'Active') {
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
      if (user.status !== 'Active') {
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
            <a href="http://localhost:5173/reset-password?token=${resetToken}" style="background: #ff0000; color: #fff; text-decoration: none; padding: 15px 30px; border-radius: 30px; font-weight: bold; display: inline-block;">RESET PASSWORD</a>
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
      
      if (detail) return { ...detail.toObject(), contentType: item.contentType };
      return null;
    }));

    res.json(watchlistDetails.filter(d => d !== null));
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

// --- Billing & Invoice Discovery ---
app.get('/api/user/transactions/:email', async (req, res) => {
  try {
    const transactions = await Transaction.find({ email: req.params.email }).sort({ createdAt: -1 });
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

// Movie Routes
app.get('/api/movies', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
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
    res.json(movie);
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
    const newReleases = await NewRelease.find().sort({ createdAt: -1 });
    res.json(newReleases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/new-releases/:id', async (req, res) => {
  try {
    const newRelease = await NewRelease.findById(req.params.id)
      .populate('actors')
      .populate('directors');
    if (!newRelease) return res.status(404).json({ message: 'New Release not found' });
    res.json(newRelease);
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

// Start Express server immediately so Hostinger's deployment proxy doesn't 504 timeout
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

mongoose.connection.on('error', err => {
  console.error('Mongoose live connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected. Awaiting automatic reconnection...');
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

    const coupon = await Coupon.findOne({ couponCode: couponCode.trim() });
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
    if (!settings) {
      settings = new PlayerSettings(req.body);
    } else {
      Object.assign(settings, req.body);
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
    if (!ads) {
      ads = new PlayerAds(req.body);
    } else {
      Object.assign(ads, req.body);
    }
    await ads.save();
    res.json(ads);
  } catch (err) {
    res.status(400).json({ message: err.message });
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
    if (!settings) {
      settings = new SMTPSettings(req.body);
    } else {
      Object.assign(settings, req.body);
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
    if (!settings) {
      settings = new SocialLoginSettings(req.body);
    } else {
      Object.assign(settings, req.body);
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
    if (!settings) {
      settings = new MenuSettings(req.body);
    } else {
      Object.assign(settings, req.body);
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
    if (!settings) {
      settings = new ReCaptchaSettings(req.body);
    } else {
      Object.assign(settings, req.body);
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
    if (!ads) {
      ads = new BannerAds(req.body);
    } else {
      Object.assign(ads, req.body);
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
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/maintenance-settings', async (req, res) => {
  try {
    let settings = await MaintenanceSettings.findOne();
    if (!settings) {
      settings = new MaintenanceSettings(req.body);
    } else {
      Object.assign(settings, req.body);
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
      if (!settings) {
        settings = new model(req.body);
      } else {
        Object.assign(settings, req.body);
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
const sendSubscriptionSuccessEmail = async (user, plan, txnId) => {
  try {
    const dynamicTransporter = await getTransporter();
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
            <p style="margin: 5px 0;"><strong>Amount:</strong> ₹${plan.price}</p>
            <p style="margin: 5px 0;"><strong>Duration:</strong> ${plan.duration}</p>
            <p style="margin: 5px 0;"><strong>Expires On:</strong> ${new Date(user.expiryDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${txnId}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173/user/profile" style="background: #b3d332; color: #000; text-decoration: none; padding: 15px 30px; border-radius: 30px; font-weight: bold; display: inline-block;">VIEW PROFILE</a>
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
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
      const coupon = await Coupon.findOne({ couponCode: req.body.couponCode.trim() });
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
    
    await sendSubscriptionSuccessEmail(user, plan, tx.paymentId);
    
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
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
    
    await sendSubscriptionSuccessEmail(user, plan, tx.paymentId);
    
    res.json({ message: 'Plan activated successfully', user: {
      status: user.status,
      subscriptionPlan: user.subscriptionPlan,
      expiryDate: user.expiryDate
    }});
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

    const PaymentGateway = require('./models/PaymentGateway');
    const gw = await PaymentGateway.findOne({ name: 'PhonePe' });
    if (!gw || gw.status !== 'Active') return res.status(400).json({ message: 'PhonePe is not active' });

    let merchantId = process.env.PHONEPE_MERCHANT_ID || gw.settings?.merchantId;
    let saltKey = process.env.PHONEPE_SALT_KEY || gw.settings?.secretKey || gw.settings?.publishableKey;
    let saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
    
    // Fallback sandbox check mapping to the correct schema path
    const isSandbox = gw.settings?.isSandbox !== false;

    const transactionId = 'TXN_' + Date.now() + Math.random().toString(36).substring(2, 7).toUpperCase();

    // Calculate final price with coupon if provided
    let finalAmountStr = plan.price.toString();
    let appliedCouponCode = null;
    let numericPrice = parseFloat(plan.price.toString().replace(/[^\d.]/g, '')) || 0;

    if (req.body.couponCode) {
      const Coupon = require('./models/Coupon');
      const coupon = await Coupon.findOne({ couponCode: req.body.couponCode.trim() });
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
    const { StandardCheckoutClient, Env, StandardCheckoutPayRequest } = require('@phonepe-pg/pg-sdk-node');
    
    const env = isSandbox ? Env.SANDBOX : Env.PRODUCTION;
    const client = StandardCheckoutClient.getInstance(merchantId, saltKey, parseInt(saltIndex), env);

    const redirectUrl = `http://localhost:5001/api/payment/phonepe/callback?txnId=${transactionId}`;
    
    // The SDK builder for V2
    const request = StandardCheckoutPayRequest.builder()
        .merchantOrderId(transactionId)
        .amount(amountInPaise)
        .redirectUrl(redirectUrl)
        .build();

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
        let merchantId = process.env.PHONEPE_MERCHANT_ID || gw.settings?.merchantId;
        let saltKey = process.env.PHONEPE_SALT_KEY || gw.settings?.secretKey || gw.settings?.publishableKey;
        let saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
        const isSandbox = gw.settings?.isSandbox !== false;
        
        const { StandardCheckoutClient, Env } = require('@phonepe-pg/pg-sdk-node');
        const env = isSandbox ? Env.SANDBOX : Env.PRODUCTION;
        const client = StandardCheckoutClient.getInstance(merchantId, saltKey, parseInt(saltIndex), env);
        
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
      return res.redirect('http://localhost:5173/user/profile?payment_status=error');
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
        const coupon = await Coupon.findOne({ couponCode: tx.couponCode.trim() });
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
        sendSubscriptionSuccessEmail(user, plan, txnId).catch(console.error);
      }
      return res.redirect('http://localhost:5173/user/profile?payment_status=success');
    } else {
      tx.status = 'Failed';
      await tx.save();
      return res.redirect('http://localhost:5173/user/profile?payment_status=failed');
    }
  } catch (err) {
    console.error('Callback error', err);
    res.redirect('http://localhost:5173/user/profile?payment_status=error');
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
    const query = {};
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
    res.json(show);
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
    const videos = await SportsVideo.find().populate('category');
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/sports-videos/:id', async (req, res) => {
  try {
    const video = await SportsVideo.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json(video);
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
    res.json(episodes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/episodes/:id', async (req, res) => {
  try {
    const episode = await Episode.findById(req.params.id)
      .populate('showId', 'title contentType')
      .populate('seasonId', 'title');
    res.json(episode);
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
    const channels = await TVChannel.find().populate('category').sort({ createdAt: -1 });
    res.json(channels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/tv-channels/:id', async (req, res) => {
  try {
    const channel = await TVChannel.findById(req.params.id).populate('category');
    if (!channel) return res.status(404).json({ message: 'Channel not found' });
    res.json(channel);
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

// Aggregated Home Data Route for Performance
app.get('/api/home-aggregated', async (req, res) => {
  try {
    const [
      sliders, movies, assets, experiences, shows, 
      newReleases, sports, channels, sportsCategories, settings, homeSections
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
      HomeSection.find({ status: 'Active' }).sort({ order: 1 }).lean().maxTimeMS(5000)
    ]);

    res.json({
      sliders,
      movies,
      assets,
      experiences,
      shows,
      newReleases,
      sports,
      channels,
      sportsCategories,
      settings,
      homeSections
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
      { new: true, runValidators: true }
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
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Content not found' });
    }
    res.json({ success: true, views: updated.views });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Serve static files from the React frontend build
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// For all non-API and non-static routes, serve the React app's index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/upload')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
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

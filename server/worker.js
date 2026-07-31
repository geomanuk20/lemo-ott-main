const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');

const { QUEUE_NAMES, registerWorker } = require('./queues/queueSystem');
const { isRedisAvailable } = require('./redisClient');

// Optional require for node-cron
const cron = (() => {
  try {
    return require('node-cron');
  } catch (err) {
    console.warn('[WORKER WARNING] node-cron module not installed. Falling back to setInterval scheduled tasks.');
    return null;
  }
})();

console.log('====================================================');
console.log('  👷 BACKGROUND WORKER PROCESS STARTING...');
console.log('====================================================');

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/video_ott';
mongoose.connect(mongoUri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
}).then(() => {
  console.log('[WORKER DB] ✅ Connected to MongoDB Cluster for Background Tasks');
}).catch((err) => {
  console.error('[WORKER DB ERROR] Failed to connect to MongoDB:', err.message);
});

// Models
const User = require('./models/User');
const SMTPSettings = require('./models/SMTPSettings');
const nodemailer = require('nodemailer');

// --- Helper: SMTP Transporter for Worker Email Job Processing ---
const getWorkerTransporter = async () => {
  try {
    const dbSettings = await SMTPSettings.findOne();
    if (dbSettings && dbSettings.host && dbSettings.host !== 'Hidden in Demo') {
      const normalizedPass = dbSettings.password ? dbSettings.password.replace(/\s/g, '') : '';
      return nodemailer.createTransport({
        host: dbSettings.host,
        port: dbSettings.port || 587,
        secure: dbSettings.encryption === 'SSL' || dbSettings.port == 465,
        auth: {
          user: dbSettings.email,
          pass: normalizedPass,
        },
        tls: { rejectUnauthorized: false },
      });
    }
  } catch (err) {
    console.error('[WORKER SMTP ERROR]', err.message);
  }

  // Environment fallback
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || process.env.SMTP_EMAIL || '',
      pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '',
    },
    tls: { rejectUnauthorized: false },
  });
};

// ====================================================
//  1. REGISTER QUEUE WORKER PROCESSORS
// ====================================================

// --- Email Queue Worker ---
registerWorker(QUEUE_NAMES.EMAIL, async (job) => {
  const { to, subject, html, text } = job.data;
  console.log(`[WORKER - EMAIL] Processing email to: ${to} (Subject: ${subject})`);
  
  if (!to) {
    throw new Error('Email recipient "to" address is missing');
  }

  const transporter = await getWorkerTransporter();
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER || '"LEMO OTT" <no-reply@lemoott.com>',
    to,
    subject,
    text,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[WORKER - EMAIL SUCCESS] Email sent to ${to} (MessageId: ${info.messageId})`);
  return { messageId: info.messageId };
});

// --- Media Processing Queue Worker ---
registerWorker(QUEUE_NAMES.MEDIA, async (job) => {
  const { mediaType, filePath, action } = job.data;
  console.log(`[WORKER - MEDIA] Processing media job: action=${action}, type=${mediaType}, file=${filePath}`);
  
  // Simulated background optimization / transcoding task hook
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(`[WORKER - MEDIA SUCCESS] Media job completed for ${filePath}`);
  return { status: 'processed', filePath };
});

// --- Push Notification Queue Worker ---
registerWorker(QUEUE_NAMES.NOTIFICATION, async (job) => {
  const { userId, title, message } = job.data;
  console.log(`[WORKER - NOTIFICATION] Dispatching push notification to userId=${userId}: ${title}`);
  return { status: 'sent', userId };
});

// ====================================================
//  2. SCHEDULED CRON JOBS
// ====================================================

// Task A: Check expired user subscriptions (Runs daily at midnight: '0 0 * * *')
const syncExpiredSubscriptions = async () => {
  try {
    const now = new Date();
    const result = await User.updateMany(
      {
        planExpirationDate: { $lt: now },
        subscriptionStatus: { $ne: 'Expired' },
      },
      {
        $set: {
          subscriptionStatus: 'Expired',
          isSubscribed: false,
        },
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`[CRON - SUBSCRIPTION SYNC] Updated ${result.modifiedCount} expired subscription(s) to 'Expired' status.`);
    }
  } catch (err) {
    console.error('[CRON ERROR - SUBSCRIPTION SYNC]', err.message);
  }
};

// Task B: Cleanup temporary uploads folder (Runs hourly: '0 * * * *')
const cleanupTempUploads = async () => {
  try {
    const tempDir = path.join(__dirname, 'uploads', 'temp');
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      const now = Date.now();
      let deletedCount = 0;
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        // Delete files older than 2 hours (7200000 ms)
        if (now - stats.mtimeMs > 7200000) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
      if (deletedCount > 0) {
        console.log(`[CRON - TEMP CLEANUP] Cleaned up ${deletedCount} temporary file(s).`);
      }
    }
  } catch (err) {
    console.error('[CRON ERROR - TEMP CLEANUP]', err.message);
  }
};

// Register Schedule Crons
if (cron) {
  cron.schedule('0 0 * * *', syncExpiredSubscriptions); // Daily at 00:00
  cron.schedule('0 * * * *', cleanupTempUploads);      // Hourly
  console.log('[WORKER CRON] Registered Cron schedules (Daily subscription sync & Hourly temp cleanup)');
} else {
  // Fallback to interval timers if node-cron is unavailable
  setInterval(syncExpiredSubscriptions, 24 * 60 * 60 * 1000); // Every 24 hours
  setInterval(cleanupTempUploads, 60 * 60 * 1000);          // Every 1 hour
  console.log('[WORKER INTERVALS] Registered Interval timer schedules for background cleanup');
}

console.log('[WORKER] 🚀 Background worker process is active and listening for tasks...');

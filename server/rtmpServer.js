/**
 * rtmpServer.js - RTMP Ingest Server using node-media-server
 * 
 * This module:
 * 1. Listens on port 1935 for OBS RTMP streams
 * 2. Validates stream key against database
 * 3. Transcodes RTMP to HLS using FFmpeg
 * 4. Auto-sets isLive: true when OBS connects / false when OBS disconnects
 * 5. Serves HLS at /live/stream/index.m3u8
 * 
 * OBS Setup:
 *   Server: rtmp://YOUR_SERVER_IP:1935/live
 *   Stream Key: (copy from admin dashboard)
 */

const NodeMediaServer = require('node-media-server');
const path = require('path');
const fs = require('fs');

// HLS output directory - served statically by Express
const HLS_OUTPUT_DIR = path.join(__dirname, 'uploads', 'hls');

// Ensure HLS directory exists
if (!fs.existsSync(HLS_OUTPUT_DIR)) {
  fs.mkdirSync(HLS_OUTPUT_DIR, { recursive: true });
}

/**
 * Creates and configures the Node Media Server instance.
 * @param {object} LiveStreamSettings - Mongoose model for live stream settings
 * @returns {NodeMediaServer} configured NMS instance
 */
const createRtmpServer = (LiveStreamSettings) => {
  const config = {
    rtmp: {
      port: 1935,
      chunk_size: 60000,
      gop_cache: true,
      ping: 30,
      ping_timeout: 60
    },
    http: {
      port: 8001,       // Internal HTTP port for NMS (not exposed directly)
      mediaroot: HLS_OUTPUT_DIR,
      allow_origin: '*'
    },
    trans: {
      ffmpeg: process.env.FFMPEG_PATH || '/usr/bin/ffmpeg', // change if ffmpeg is elsewhere
      tasks: [
        {
          app: 'live',
          hls: true,
          hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
          hlsKeep: false,
          dash: false,
        }
      ]
    }
  };

  const nms = new NodeMediaServer(config);

  // --- Event: Stream Published (OBS starts streaming) ---
  nms.on('prePublish', async (id, StreamPath, args) => {
    console.log('[RTMP] OBS stream incoming:', StreamPath);
    
    // Extract stream key from path: /live/<streamKey>
    const parts = StreamPath.split('/');
    const streamKey = parts[parts.length - 1];
    
    try {
      const settings = await LiveStreamSettings.findOne();
      if (!settings) {
        console.log('[RTMP] No stream settings found — rejecting stream');
        const session = nms.getSession(id);
        if (session) session.reject();
        return;
      }

      // Validate stream key
      if (settings.streamKey !== streamKey) {
        console.log(`[RTMP] Invalid stream key: "${streamKey}" — expected: "${settings.streamKey}" — REJECTING`);
        const session = nms.getSession(id);
        if (session) session.reject();
        return;
      }

      // Valid key — mark as live
      settings.isLive = true;
      settings.isScheduled = false;
      settings.startedAt = new Date();
      await settings.save();
      console.log(`[RTMP] ✅ Stream key valid. Stream is now LIVE.`);

    } catch (err) {
      console.error('[RTMP] Error validating stream key:', err.message);
    }
  });

  // --- Event: Stream Done (OBS stops streaming) ---
  nms.on('donePublish', async (id, StreamPath, args) => {
    console.log('[RTMP] OBS stream ended:', StreamPath);

    try {
      const settings = await LiveStreamSettings.findOne();
      if (settings) {
        settings.isLive = false;
        settings.startedAt = null;
        await settings.save();
        console.log('[RTMP] Stream marked as offline.');
      }
    } catch (err) {
      console.error('[RTMP] Error updating live status:', err.message);
    }

    // Clean up HLS segments after stream ends
    try {
      const streamKey = StreamPath.split('/').pop();
      const hlsDir = path.join(HLS_OUTPUT_DIR, 'live', streamKey);
      if (fs.existsSync(hlsDir)) {
        fs.readdirSync(hlsDir).forEach(file => {
          if (file.endsWith('.ts') || file.endsWith('.m3u8')) {
            fs.unlinkSync(path.join(hlsDir, file));
          }
        });
        console.log('[RTMP] HLS segments cleaned up.');
      }
    } catch (err) {
      console.error('[RTMP] Error cleaning up HLS segments:', err.message);
    }
  });

  return nms;
};

/**
 * Get the HLS stream URL for a given stream key.
 * @param {string} streamKey 
 * @param {string} serverBaseUrl - e.g. https://yourdomain.com or http://localhost:5001
 * @returns {string} HLS playlist URL
 */
const getHlsUrl = (streamKey, serverBaseUrl) => {
  return `${serverBaseUrl}/hls/live/${streamKey}/index.m3u8`;
};

module.exports = { createRtmpServer, getHlsUrl, HLS_OUTPUT_DIR };

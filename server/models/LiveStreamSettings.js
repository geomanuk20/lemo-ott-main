const mongoose = require('mongoose');

const LiveStreamSettingsSchema = new mongoose.Schema({
  streamKey: { type: String, default: '' },
  serverType: { type: String, default: 'local' }, // 'local' or 'custom'
  serverUrl: { type: String, default: 'rtmp://live.lemoott.com/live' },
  playbackUrl: { type: String, default: 'http://live.lemoott.com/hls/live/{streamKey}/index.m3u8' },
  streamTitle: { type: String, default: 'Lemo OTT Live Stream' },
  streamCategory: { type: String, default: 'Entertainment' },
  isLive: { type: Boolean, default: false },
  viewers: { type: Number, default: 0 },
  streamPoster: { type: String, default: '' },
  isScheduled: { type: Boolean, default: false },
  scheduledTime: { type: Date, default: null },
  chatEnabled: { type: Boolean, default: true },
  startedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('LiveStreamSettings', LiveStreamSettingsSchema);

const mongoose = require('mongoose');

const LiveStreamSettingsSchema = new mongoose.Schema({
  streamKey: { type: String, default: '' },
  serverUrl: { type: String, default: 'rtmp://live.lemoott.com/live' },
  streamTitle: { type: String, default: 'Lemo OTT Live Stream' },
  streamCategory: { type: String, default: 'Entertainment' },
  isLive: { type: Boolean, default: false },
  viewers: { type: Number, default: 0 },
  streamPoster: { type: String, default: '' },
  isScheduled: { type: Boolean, default: false },
  scheduledTime: { type: Date, default: null },
  chatEnabled: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('LiveStreamSettings', LiveStreamSettingsSchema);

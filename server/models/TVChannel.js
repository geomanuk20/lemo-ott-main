const mongoose = require('mongoose');

const tvChannelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'TVCategory', required: true },
  tvAccess: { type: String, default: 'Paid' },
  status: { type: String, default: 'Active' },
  isScheduled: { type: Boolean, default: false },
  scheduledPublishTime: { type: Date, default: null },
  streamType: { type: String, default: 'HLS/m3u8 / MPEG-DASH / YouTube / Vimeo' },
  server1Url: { type: String },
  server2Url: { type: String },
  server3Url: { type: String },
  embedCode: { type: String },
  logo: { type: String },
  seoTitle: { type: String },
  metaDescription: { type: String },
  keywords: { type: String },
  views: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('TVChannel', tvChannelSchema);

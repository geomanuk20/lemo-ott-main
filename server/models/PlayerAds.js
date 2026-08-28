const mongoose = require('mongoose');

const BuiltInAdItemSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  source: { type: String, default: '' },
  timestart: { type: String, default: '00:00:10' },
  targetLink: { type: String, default: '#' },
  skipAfter: { type: Number, default: 5 }
}, { _id: true });

const PlayerAdsSchema = new mongoose.Schema({
  defaultAds: { type: String, default: 'Built-in Advertisement' },
  sourceType: { type: String, default: 'URL' },
  sourceUrl: { type: String, default: 'https://cdn.theplayer.com/demos/ads/vast/vast.xml' },
  
  // Dynamic multi-ad slots
  builtInAds: {
    type: [BuiltInAdItemSchema],
    default: []
  },
  
  // Legacy Ad slots (kept for backward compatibility)
  ad1Source: { type: String, default: '' },
  ad1Timestart: { type: String, default: '00:00:10' },
  ad1TargetLink: { type: String, default: '#' },
  
  ad2Source: { type: String, default: '' },
  ad2Timestart: { type: String, default: '00:30:00' },
  ad2TargetLink: { type: String, default: '#' },
  
  ad3Source: { type: String, default: '' },
  ad3Timestart: { type: String, default: '01:30:00' },
  ad3TargetLink: { type: String, default: '#' }
}, { timestamps: true });

module.exports = mongoose.model('PlayerAds', PlayerAdsSchema);

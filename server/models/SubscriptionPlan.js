const mongoose = require('mongoose');

const SubscriptionPlanSchema = new mongoose.Schema({
  planName: { type: String, required: true },
  duration: { type: String, required: true },
  price: { type: String, required: true },
  deviceLimit: { type: String, required: true },
  ads: { type: String, default: 'OFF' },
  streamingQuality: { type: String, default: 'HD' },
  status: { type: String, default: 'Active' },
  getStarted: { type: String, default: 'ON' }
}, { timestamps: true });

module.exports = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);

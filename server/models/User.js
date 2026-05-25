const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'sub-admin', 'subscriber', 'customer'],
    default: 'customer'
  },
  name: { type: String, default: '' },
  phone: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  status: { type: String, default: 'Active' },
  subscriptionPlan: { type: String, default: 'Basic Plan' },
  expiryDate: { type: String, default: '2099-12-31' },
  authProvider: { type: String, default: 'Email' },
  isDeleted: { type: Boolean, default: false },
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
  watchlist: [{
    contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    contentType: { type: String, enum: ['movie', 'show', 'sports', 'live'], required: true }
  }],
  activeSessions: [{
    token: { type: String, required: true },
    deviceId: { type: String, required: true },
    loginAt: { type: Date, default: Date.now }
  }],
  deviceHistory: [{
    deviceId: { type: String, required: true },
    status: { type: String, enum: ['Success', 'Blocked (Limit Reached)'], required: true },
    loginAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);

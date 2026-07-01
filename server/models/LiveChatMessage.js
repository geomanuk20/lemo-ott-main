const mongoose = require('mongoose');

const LiveChatMessageSchema = new mongoose.Schema({
  user: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, required: true },
  color: { type: String, default: '#ffffff' },
  system: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('LiveChatMessage', LiveChatMessageSchema);

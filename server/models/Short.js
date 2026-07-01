const mongoose = require('mongoose');

const ShortSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  access: { type: String, enum: ['Free', 'Paid'], default: 'Free' }
}, { timestamps: true });

module.exports = mongoose.model('Short', ShortSchema);

const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  contentType: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 }
}, { timestamps: true });

// Ensure a user can only rate a specific content item once
ratingSchema.index({ userId: 1, contentId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);

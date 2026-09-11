const mongoose = require('mongoose');

const showSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  sortInfo: String,
  upcoming: { type: String, default: 'No' },
  seriesAccess: { type: String, default: 'Paid' },
  language: { type: String, required: true },
  genres: [String],
  actors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Actor' }],
  directors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Director' }],
  imdbRating: String,
  contentRating: { type: String, default: '16+' },
  poster: String,
  thumbnail: String,
  status: { type: String, default: 'Active' },
  isScheduled: { type: Boolean, default: false },
  scheduledPublishTime: { type: Date, default: null },
  releaseYear: Number,
  videoQuality: { type: String, default: '4K Ultra HD' },
  seoTitle: String,
  metaDescription: String,
  keywords: String,
  imdbId: String,
  rating: { type: String, default: '4.8' }, // For frontend display fallback
  contentType: { type: String, default: 'TV Show' }, // For separating standard TV Shows and Short Web Series
  views: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Show', showSchema);

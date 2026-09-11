const mongoose = require('mongoose');

const newReleaseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  sortInfo: String,
  upcoming: { type: String, default: 'No' },
  access: { type: String, default: 'Paid' },
  language: { type: String, required: true },
  genres: [String],
  actors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Actor' }],
  directors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Director' }],
  imdbRating: String,
  contentRating: { type: String, default: '16+' },
  releaseYear: Number,
  duration: String,
  poster: String,
  thumbnail: String,
  banner: String,
  trailerUrl: String,
  videoType: { type: String, default: 'Local' },
  videoQuality: { type: String, default: '8K Ultra HD' },
  videoFile: String,
  videoFile480: String,
  videoFile720: String,
  videoFile1080: String,
  subtitlesActive: { type: String, default: 'Inactive' },
  subtitles: [{
    language: String,
    url: String
  }],
  status: { type: String, default: 'Active' },
  isScheduled: { type: Boolean, default: false },
  scheduledPublishTime: { type: Date, default: null },
  seoTitle: String,
  metaDescription: String,
  keywords: String,
  imdbId: String,
  views: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('NewRelease', newReleaseSchema);

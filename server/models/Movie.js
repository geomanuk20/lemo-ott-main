const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  imdbId: String,
  title: { type: String, required: true },
  contentType: { type: String, default: 'Movie' },
  description: String,
  sortInfo: String,
  upcoming: { type: String, default: 'No' },
  seriesAccess: { type: String, default: 'Paid' },
  access: { type: String, default: 'Paid' }, // Legacy support
  language: { type: String, required: true },
  genres: [String],
  actors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Actor' }],
  directors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Director' }],
  imdbRating: String,
  contentRating: { type: String, default: '16+' },
  releaseDate: Date,
  duration: String,
  status: { type: String, default: 'Active' },
  isScheduled: { type: Boolean, default: false },
  scheduledPublishTime: { type: Date, default: null },
  
  thumbnail: String,
  poster: String,
  trailerUrl: String,
  videoType: { type: String, default: 'Local' },
  videoQuality: { type: String, default: '8K Ultra HD' },
  videoFile: String,
  videoFile480: String,
  videoFile720: String,
  videoFile1080: String,
  
  downloadable: { type: String, default: 'Inactive' },
  downloadUrl: String,
  
  subtitlesActive: { type: String, default: 'Inactive' },
  subtitles: [{
    language: String,
    url: String
  }],
  
  seoTitle: String,
  metaDescription: String,
  keywords: String,
  views: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Movie', movieSchema);

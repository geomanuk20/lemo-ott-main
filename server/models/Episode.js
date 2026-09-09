const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema({
  imdbId: String,
  title: { type: String, required: true },
  description: String,
  access: { type: String, default: 'Paid' },
  showId: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
  seasonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Season' },
  imdbRating: String,
  releaseDate: Date,
  duration: String,
  status: { type: String, default: 'Active' },
  upcoming: { type: String, default: 'No' },
  
  poster: String,
  videoType: { type: String, default: 'Local' },
  videoQuality: { type: String, default: 'Active' },
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
  keywords: String
}, { timestamps: true });

module.exports = mongoose.model('Episode', episodeSchema);

const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  contentName: { type: String, required: true },
  language: { type: String, required: true },
  genres: { type: [String], required: true },
  actors: { type: String, required: true },
  directors: { type: String, required: true },
  thumbnailLink: { type: String, required: true },
  sliderLink: { type: String, required: true },
  posterLink: { type: String, required: true },
  trailerLink: { type: String },
  videoLink: { type: String, required: true },
  description: { type: String, required: true },
  contentType: { type: String, required: true },
  duration: { type: String, required: true },
  ageRating: { type: String, required: true },
  content18Plus: { type: String, required: true },
  status: { type: String, required: true },
  paymentDescription: { type: String },
  paymentMethod: { type: String, required: true },
  paymentId: { type: String },
  paymentStatus: { type: String, default: 'Pending' },
  reviewStatus: { type: String, default: 'Under Review', enum: ['Under Review', 'Approved', 'Rejected', 'On Hold'] }
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);

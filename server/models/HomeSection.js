const mongoose = require('mongoose');

const homeSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  sectionType: { type: String, enum: ['Movie', 'New Release', 'Short Film', 'Short Web Series', 'Shows', 'Sports', 'Live TV', 'Language', 'Genre', 'Shorts', ''], default: '' },
  layout: { type: String, enum: ['Grid', 'Slider', 'Horizontal'], default: 'Slider' },
  limit: { type: Number, default: 10 },
  status: { type: String, default: 'Active' },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('HomeSection', homeSectionSchema);

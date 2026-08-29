const mongoose = require('mongoose');

const careerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    default: 'General',
    trim: true
  },
  location: {
    type: String,
    default: 'Kerala',
    trim: true
  },
  experience: {
    type: String,
    default: '1-3 years',
    trim: true
  },
  qualification: {
    type: String,
    default: 'Graduate',
    trim: true
  },
  jobType: {
    type: String,
    default: 'Full Time',
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  contactEmail: {
    type: String,
    default: 'hr@lemoott.com',
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Career', careerSchema);

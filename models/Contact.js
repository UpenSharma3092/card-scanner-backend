const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  name2: String,
  company: {
    type: String,
    required: [true, 'Please add a company'],
  },
  designation: String,
  email: String,
  phones: [String],
  website: String,
  address: String,
  socialMedia: String,
  notes: String,
  avatarUrl: String,
  cardImagePath: String,
  backCardImagePath: String,
  industry: {
    type: String,
    required: [true, 'Please add an industry'],
  },
  confidenceScores: {
    type: Map,
    of: Number,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Contact', ContactSchema);

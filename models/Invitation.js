const mongoose = require('mongoose');

const InvitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please add an email'],
  },
  inviter: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member',
  },
  status: {
    type: String,
    enum: ['pending', 'accepted'],
    default: 'pending',
  },
  invitedAt: {
    type: Date,
    default: Date.now,
  },
});

// Since one user might be invited multiple times, we keep it simple for now.
// In a real app, you might want to unique index on (email, inviter).

module.exports = mongoose.model('Invitation', InvitationSchema);

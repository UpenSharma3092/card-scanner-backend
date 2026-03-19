const mongoose = require('mongoose');

const TeamMemberSchema = new mongoose.Schema({
  // The user who is a team member
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  // The owner/inviter of the team
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  company: {
    type: String,
    required: [true, 'Please add a company'],
  },
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member',
  },
  department: {
    type: String,
    default: 'General',
  },
  avatarUrl: String,
  contactsScanned: {
    type: Number,
    default: 0,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

// Since a user can only be once in a specific owners team with specific email:
TeamMemberSchema.index({ owner: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('TeamMember', TeamMemberSchema);

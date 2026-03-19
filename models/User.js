const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId;
    },
    minlength: 6,
    select: false,
  },
  company: {
    type: String,
    required: [true, 'Please add a company'],
    default: 'Individual',
  },
  phone: String,
  avatarUrl: String,
  profilePicture: String,
  googleId: String,
  plan: {
    type: String,
    enum: ['Free', 'Premium', 'Enterprise'],
    default: 'Free',
  },
  settings: {
    weeklyScanReports: { type: Boolean, default: true },
    realTimeScanAlerts: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    incognitoScanning: { type: Boolean, default: false },
    dataSharing: { type: Boolean, default: true },
  },
  resetPasswordOTP: String,
  resetPasswordExpires: Date,
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);

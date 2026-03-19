const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
  },
  body: {
    type: String,
    required: [true, 'Please add a body'],
  },
  category: {
    type: String,
    enum: ['scanAlert', 'weeklyReport', 'systemUpdate'],
    required: [true, 'Please add a category'],
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notification', NotificationSchema);

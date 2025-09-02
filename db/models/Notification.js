// /db/models/Notification.js

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId, // User tablosuna referans için ObjectId
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  body: {
    type: String,
    required: true,
    trim: true,
  },
  is_read: {
    type: Boolean,
    default: false,
  },
   is_dismissed: { type: Boolean, default: false } ,
  created_at: {
    type: Date,
    default: Date.now,
  },
});
NotificationSchema.index({ user_id: 1, created_at: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);

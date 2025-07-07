const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema({
  userId: {
    type: Number, // تغيير من ObjectId إلى Number للتوافق مع user model
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// إضافة index للبحث السريع
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

module.exports = mongoose.model("Notification", notificationSchema);


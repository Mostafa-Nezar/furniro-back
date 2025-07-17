const mongoose = require("mongoose");
const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);
const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: Number,
    unique: true,
  },
  userId: {
    type: Number,
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

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { name: "notificationId" },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );
      this.notificationId = counter.value;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model("Notification", notificationSchema);

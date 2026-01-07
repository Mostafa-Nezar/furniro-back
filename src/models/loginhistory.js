const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  email: String,
  date: { type: Date, default: Date.now },
  ip: String,
  userAgent: String,
  google: { type: Boolean, default: false },
  location: {
    country: String,
    city: String,
    region: String,
    latitude: Number,
    longitude: Number,
    locationString: String,
  }
});

module.exports = mongoose.model("LoginLog", loginHistorySchema);

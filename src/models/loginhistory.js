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
  },
  deviceInfo: {
    brand: String,
    manufacturer: String,
    model: String,
    device: String,
    product: String,
    androidVersion: String,
    sdk: Number,
    name: String,
    webBrowserInfo: mongoose.Schema.Types.Mixed,
  }
});

module.exports = mongoose.model("LoginLog", loginHistorySchema);

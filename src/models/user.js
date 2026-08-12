const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  id: { type: Number, unique: true, required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String },
  isGoogleUser: { type: Boolean, default: false },
  image: { type: String, default: null },
  notifications: { type: mongoose.Schema.Types.ObjectId, ref: "Notification2" },
  isSubscribed: { type: Boolean, default: false },
  phoneNumber: { type: String, default: null },
  location: { type: String, default: "" },
  cart: { type: mongoose.Schema.Types.ObjectId, ref: "Cart" },
  orders: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  fcmToken: { type: String, default: null }
});
module.exports = mongoose.model("xser", userSchema);
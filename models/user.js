const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  id: { type: Number, unique: true, required: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String },
  cart: { type: Array, default: [] },
  favorites: { type: Array, default: [] },
  isGoogleUser: { type: Boolean, default: false },
  image: { type: String, default: null },
});
module.exports = mongoose.model("User", userSchema);
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cart: { type: Array, default: [] },
  favorites: { type: Array, default: [] },
});

module.exports = mongoose.model("User", userSchema);



const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  id: { type: Number, unique: true, required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String },
  cart: { type: Array, default: [] },
  isGoogleUser: { type: Boolean, default: false },
  image: { type: String, default: null },
  isSubscribed:{type:Boolean, default:false},
  isFacebookUser: { type: Boolean, default: false },
  facebookId: { type: String, unique: true, sparse: true },
  phoneNumber: { type: String, default: null }, 
  location:{ type: String, default: "" }

});
module.exports = mongoose.model("User", userSchema);
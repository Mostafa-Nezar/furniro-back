const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  id: { type: Number, unique: true, required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String },
  isGoogleUser: { type: Boolean, default: false },
  image: { type: String, default: null },
  isSubscribed:{type:Boolean, default:false},
  phoneNumber: { type: String, default: null }, 
  location:{ type: String, default: "" },
});
module.exports = mongoose.model("xser", userSchema);
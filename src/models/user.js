const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  id: { type: Number, unique: true, required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String },
  isGoogleUser: { type: Boolean, default: false },
  image: { type: String, default: null },
  isSubscribed: { type: Boolean, default: false },
  phoneNumber: { type: String, default: "" },
  location: { type: String, default: "" },
  fcmToken: { type: String, default: null },
});

userSchema.virtual("notifications", {
  ref: "Notification2",
  localField: "id",
  foreignField: "userId",
});

userSchema.virtual("cart", {
  ref: "Cart",
  localField: "_id",
  foreignField: "user_id",
  justOne: true,
});

userSchema.virtual("orders", {
  ref: "Order",
  localField: "_id",
  foreignField: "userref",
});

userSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});
userSchema.set("toObject", {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model("xser", userSchema);
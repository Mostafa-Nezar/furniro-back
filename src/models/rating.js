const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
  rateid: { type: String, required: true, unique: true },
  userid: { type: Number, required: true, index: true },
  userref: { type: mongoose.Schema.Types.ObjectId, ref: "xser", required: true, index: true },
  productref: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  productid: { type: Number, required: true, index: true },
  rate: { type: Number, required: true, min: 0, max: 5 },
  createdAt: { type: Date, default: Date.now },
  comment: { type: String, default: "" },
});

module.exports = mongoose.model("Rating", ratingSchema);

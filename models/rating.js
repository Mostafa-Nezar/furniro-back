const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
  userid: {
    type: Number,
    required: true,
  },
  productid: {
    type: Number,
    required: true,
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Rating", ratingSchema);

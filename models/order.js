const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  quantity: Number,
});

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  products: [productSchema],
  date: { type: Date, default: Date.now },
  total: { type: Number, required: true },
});


module.exports = mongoose.model("Order", orderSchema);

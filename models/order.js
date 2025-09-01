const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({ name: String, price: Number,  quantity: Number });

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  payment: {type: String, default: "cash on delivery"},
  products: [productSchema],
  date: { type: Date, default: Date.now },
  total: { type: Number, required: true },
  status: { type: String, enum: ["refused", "canceled", "accepted", "shipping", "delivered"], default: "pending" }
});

module.exports = mongoose.model("Order", orderSchema);

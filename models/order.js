const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  stripeSessionId: { type: String, required: true, unique: true },
  email: String,
  name: String,
  address: Object,
  amount: Number,
  paymentStatus: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);

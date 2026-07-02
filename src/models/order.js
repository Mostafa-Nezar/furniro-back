const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({id:Number, productId: String, name: String, price: Number, quantity: Number, size:String, color:String, image: String });
const customerInfoSchema = new mongoose.Schema({ fullName: String, email: String, address: String, city: String, state: String, zipCode: String, phoneNumber: Number });
const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  paymentdone: {type: String, default: "cash on delivery"},
  payment: { type: Object },
  products: [productSchema],
  customerInfo: customerInfoSchema,
  date: { type: Date, default: Date.now },
  total: { type: Number, required: true },
  status: { type: String, enum: ["pending", "refused", "cancelled", "paid", "shipping", "delivered"], default: "pending" },
  userlocation:{type: String, default:""},
  deliveryDate: { type: String, default: "" },
  userref: { type: mongoose.Schema.Types.ObjectId, ref: "xser", required: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);

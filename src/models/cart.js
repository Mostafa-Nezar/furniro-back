const mongoose = require("mongoose");
const cartItemSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, default: 1, min: 1 },
        variant: { color: String, size: String },
        priceAtAdd: { type: Number, required: true },
    }, { _id: false }
);

const cartSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        items: [cartItemSchema],
        totalItems: { type: Number, default: 0 },
        totalPrice: { type: Number, default: 0 },
    }, { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
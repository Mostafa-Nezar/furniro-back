const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true
    },

    userRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "xser"
    },

    items: [
      {
        productId: {
          type: Number,
          required: true
        },

        variantId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true
        },

        quantity: {
          type: Number,
          default: 1
        },

        priceSnapshot: {
          type: Number
        },

        addedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("cart", cartSchema);
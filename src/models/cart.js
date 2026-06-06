const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    userId: {
        type: Number,
        required: true
    },
    userRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "xser"
    },
    items: {
        type: Array,
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model("cart", cartSchema);

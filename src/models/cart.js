const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "xser",
        required: true
    },
    items: {
        type: Array,
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model("cart", cartSchema);

const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String },
    image: { type: String, default: null },
    phoneNumber: { type: String, default: null },
    location: { type: String, default: "" },
    role: { type: String, enum: ["admin", "superadmin"], default: "admin" },
    permissions: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);

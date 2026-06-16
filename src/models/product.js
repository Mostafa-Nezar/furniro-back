const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  key: { type: String },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  salePrice: { type: Number },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  colors: [String],
  sizes: [String],
  images: [String],
  averagerate: { type: Number, default: 0 },
  ratecount: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  date: { type: Number, default: Date.now },
  sale: { type: Number, default: 0 },
  des: { type: String },
  general: {
    type: new mongoose.Schema(
      { salespackage: { type: String, default: "" }, model: { type: String, default: "" }, secondary: { type: String, default: "" }, configuration: { type: String, default: "" }, upholsterymaterial: { type: String, default: "" }, upholsterycolor: { type: String, default: "" } },
      { _id: false, strict: false }
    ),
    default: () => ({}),
  },

  myproduct: {
    type: new mongoose.Schema(
      { fillingmaterial: { type: String, default: "" }, finishtype: { type: String, default: "" }, adjustableheadrest: { type: String, default: "" }, maximumloadcapacity: { type: String, default: "" }, originalofmanufacture: { type: String, default: "" } },
      { _id: false, strict: false }
    ),
    default: () => ({}),
  },

  dimensions: {
    type: new mongoose.Schema(
      { width: { type: String, default: "" }, height: { type: String, default: "" }, depth: { type: String, default: "" }, weight: { type: String, default: "" }, seatheight: { type: String, default: "" }, legheight: { type: String, default: "" } },
      { _id: false, strict: false }
    ),
    default: () => ({}),
  },

  warranty: {
    type: new mongoose.Schema(
      { summary: { type: String, default: "" }, servicetype: { type: String, default: "" }, dominstic: { type: String, default: "" }, covered: { type: String, default: "" }, notcovered: { type: String, default: "" } },
      { _id: false, strict: false }
    ),
    default: () => ({}),
  },

  customAttributes: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { collection: "productslists_sorted" });

module.exports = mongoose.model("Product", productSchema);

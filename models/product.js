const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
   id: { type: Number, required: true, unique: true },
  key: { type: String },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  des: { type: String },
  not: { type: String },

  general: {
    salespackage: String,
    model: String,
    secoundary: String,
    configuration: String,
    upholsterymaterial: String,
    upholsterycolor: String,
  },

  myproduct: {
    filingmaterial: String,
    finishtype: String,
    adjustheaderest: String,
    maxmumloadcapcity: String,
    originalofmanufacture: String,
  },

  dimensions: {
    width: String,
    height: String,
    depth: String,
    weight: String,
    seatheight: String,
    legheight: String,
  },

  warranty: {
    summry: String,
    servicetype: String,
    dominstic: String,
    covered: String,
    notcovered: String,
  },

  image: String,
  image1: String,
  image2: String,
  image3: String,
  image4: String,

  sale: Number,
  averagerate: Number,
  ratecount: Number,
  quantity: { type: Number, default: 0 }, // Added quantity field
}, { collection: "productslists" });

module.exports = mongoose.model("Product", productSchema);



const Product = require("../models/product");
const Category = require("../models/category");

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ id: 1 }).populate("category");
    res.json(products);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch products" });
  }
};

exports.updateProduct = async (req, res) => {
  const productId = parseInt(req.params.id);
  try {
    const updatedProduct = await Product.findOneAndUpdate(
      { id: productId },
      { $set: req.body },
      { new: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ msg: "Product not found" });
    }
    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ msg: "Failed to update product" });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json(categories);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
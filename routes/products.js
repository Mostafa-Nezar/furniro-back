const express = require("express");
const router = express.Router();
const Product = require("../models/product");

router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch products" });
  }
});

router.patch("/:id", async (req, res) => {
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
});

module.exports = router;

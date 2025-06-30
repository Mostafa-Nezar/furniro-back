const express = require("express");
const router = express.Router();
const fs = require("fs");

// ✅ بيانات من ملف JSON محلي
router.get("/", (req, res) => {
  fs.readFile("productlist.json", "utf-8", (err, data) => {
    if (err) return res.status(500).json({ msg: "Failed to read file" });
    const products = JSON.parse(data);
    res.json(products);
  });
});
// ✅ تعديل منتج معين
router.patch("/:id", (req, res) => {
  const productId = parseInt(req.params.id);
  const updates = req.body;

  fs.readFile("productlist.json", "utf-8", (err, data) => {
    if (err) return res.status(500).json({ msg: "Failed to read file" });

    let products = JSON.parse(data);
    const productIndex = products.findIndex((p) => p.id === productId);

    if (productIndex === -1) {
      return res.status(404).json({ msg: "Product not found" });
    }

    // تعديل القيم
    products[productIndex] = { ...products[productIndex], ...updates };

    fs.writeFile("productlist.json", JSON.stringify(products, null, 2), (err) => {
      if (err) return res.status(500).json({ msg: "Failed to write file" });
      res.json(products[productIndex]);
    });
  });
});


module.exports = router;

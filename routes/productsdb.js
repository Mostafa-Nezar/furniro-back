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

module.exports = router;

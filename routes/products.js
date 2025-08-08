const express = require("express");
const router = express.Router();
const { getAllProducts, updateProduct } = require("../controllers/products");

router.get("/", getAllProducts);
router.patch("/:id", updateProduct);

module.exports = router;

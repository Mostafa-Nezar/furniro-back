const express = require("express");
const router = express.Router();
const { getAllProducts, updateProduct,getCategories } = require("../controllers/products");
const auth = require("../middleware/auth");
router.get("/", getAllProducts);
router.patch("/:id", auth, updateProduct );
router.get("/categories", getCategories);

module.exports = router;

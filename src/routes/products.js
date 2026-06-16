const express = require("express");
const router = express.Router();
const { getAllProducts, updateProduct  } = require("../controllers/products");
const auth = require("../middleware/auth");
router.get("/", getAllProducts);
router.patch("/:id", auth, updateProduct );
module.exports = router;

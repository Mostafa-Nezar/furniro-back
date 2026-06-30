const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cart");
const auth = require("../middleware/auth");


router.get("/", auth, cartController.getCart);
router.post("/items", auth, cartController.addItem);
router.patch("/items/:productId", auth, cartController.updateItem);
router.delete("/items/:productId", auth, cartController.removeItem);
router.delete("/", auth, cartController.clearCart);

module.exports = router;
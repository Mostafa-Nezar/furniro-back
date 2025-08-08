const express = require("express");
const router = express.Router();
const { createOrder, getUserOrders } = require("../controllers/orders");

router.post("/", createOrder);
router.get("/user/:userId", getUserOrders);

module.exports = router;

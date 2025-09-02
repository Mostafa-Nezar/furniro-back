const express = require("express");
const router = express.Router();
const { createOrder, getUserOrders, updateOrderStatus } = require("../controllers/orders");

router.post("/", createOrder);
router.get("/user/:userId", getUserOrders);
router.patch("/orders/:orderId/status", updateOrderStatus);

module.exports = router;

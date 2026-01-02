const express = require("express");
const router = express.Router();
const { createOrder, getUserOrders, updateOrderStatus } = require("../controllers/orders");
const { createOrderSchema, updateOrderStatusSchema } = require("../validators/order");
const validate = require("../middleware/validate");

router.post("/", validate(createOrderSchema), createOrder);
router.get("/user/:userId", getUserOrders);
router.patch("/:orderId/status", validate(updateOrderStatusSchema), updateOrderStatus);

module.exports = router;

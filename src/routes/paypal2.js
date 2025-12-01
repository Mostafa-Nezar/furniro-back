const express = require("express");
const router = express.Router();
const paypalController = require("../controllers/paypal2.js");
router.post("/orders", paypalController.createOrder);
router.post("/orders/:orderID/capture", paypalController.captureOrder);
module.exports = router;

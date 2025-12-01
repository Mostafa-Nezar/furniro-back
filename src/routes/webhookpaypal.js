const express = require("express");
const router = express.Router();
const { createPaypalOrder } = require("../controllers/webhookpaypal");

router.post("/create-paypal-order", createPaypalOrder);

module.exports = router;

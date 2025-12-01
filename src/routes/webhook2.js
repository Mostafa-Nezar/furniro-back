
const express = require("express");
const router = express.Router();
const { handleStripeWebhook2 } = require("../controllers/webhook2"); 

router.post("/", express.raw({ type: "application/json" }), handleStripeWebhook2);

module.exports = router;

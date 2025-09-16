
const express = require("express");
const router = express.Router();
const { handleStripeWebhook2 } = require("../controllers/webhook2"); 

router.post("/", handleStripeWebhook2);

module.exports = router;

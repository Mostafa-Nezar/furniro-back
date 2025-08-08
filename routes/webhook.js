const express = require("express");
const router = express.Router();
const { handleStripeWebhook } = require("../controllers/webhook");

// ⚠️ IMPORTANT: only `"/"` here, because full path is declared in index.js
router.post("/", express.raw({ type: "application/json" }), handleStripeWebhook);

module.exports = router;

const express = require("express");
const router = express.Router();
const { getToken, checkout } = require("../controllers/braintree");

router.get("/token", getToken);
router.post("/checkout", checkout);

module.exports = router;

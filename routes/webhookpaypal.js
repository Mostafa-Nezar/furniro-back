const express = require("express");
const router = express.Router();
const Order = require("../models/order");

router.post("/paypal/webhook", async (req, res) => {
  const event = req.body;

  if (event.event_type === "CHECKOUT.ORDER.APPROVED") {
    const newOrder = {
      paypalOrderId: event.resource.id,
      email: event.resource.payer.email_address,
      name: event.resource.payer.name.given_name,
      amount: event.resource.purchase_units[0].amount.value,
      paymentStatus: "COMPLETED",
      createdAt: new Date().toISOString(),
    };

    try {
      const existing = await Order.findOne({ paypalOrderId: newOrder.paypalOrderId });
      if (!existing) {
        await Order.create(newOrder);
        console.log("✅ PayPal Order saved");
      }
    } catch (err) {
      console.error("❌ Failed to save PayPal order:", err);
    }
  }

  res.status(200).send("Webhook received");
});

module.exports = router;

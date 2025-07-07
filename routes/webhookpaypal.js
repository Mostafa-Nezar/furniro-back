const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const NotificationService = require("../utils/notificationService");

// ⚙️ تحكم وهمي في المستخدم
const isFakeUser = true;
const fakeUserId = 99999;

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

        if (isFakeUser) {
          await NotificationService.createNotification(
            fakeUserId,
            `تم حفظ طلبك من باي بال بنجاح. المبلغ: $${newOrder.amount}`
          );
        }
      }
    } catch (err) {
      console.error("❌ Failed to save PayPal order:", err);
      if (isFakeUser) {
        await NotificationService.createNotification(
          fakeUserId,
          "حدث خطأ أثناء حفظ طلب باي بال."
        );
      }
    }
  }

  res.status(200).send("Webhook received");
});

module.exports = router;

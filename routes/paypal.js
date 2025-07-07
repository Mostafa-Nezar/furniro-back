const express = require("express");
const router = express.Router();
const { client } = require("../config/paypal");
const paypal = require("@paypal/checkout-server-sdk");
const NotificationService = require("../utils/notificationService");

const FAKE_USER_ID = 99999; // متغير وهمي تستخدمه بدل تحقق باي بال الحقيقي
const IS_FAKE_USER_LOGGED = true; // تحكم في حال وجود مستخدم أو لا

router.post("/create-paypal-order", async (req, res) => {
  const { total = "20.00", userId = 99999 } = req.body;

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: total,
        },
      },
    ],
    application_context: {
      return_url: "https://example.com/success",
      cancel_url: "https://example.com/cancel",
    },
  });

  try {
    const order = await client().execute(request);
    const approvalLink = order.result.links.find(link => link.rel === "approve")?.href;

    // ✅ إرسال إشعار حتى قبل الدفع
    const NotificationService = require("../utils/notificationService");
    await NotificationService.createNotification(
      userId,
      `تم إنشاء طلب PayPal برقم #${order.result.id}. يرجى المتابعة للدفع.`
    );

    console.log("✅ PayPal order created:", {
      id: order.result.id,
      approvalLink,
    });

    res.status(200).json({
      id: order.result.id,
      approveUrl: approvalLink,
    });
  } catch (err) {
    console.error("❌ PayPal create order error:", err);
    res.status(500).json({ error: "فشل في إنشاء الطلب" });
  }
});


module.exports = router;

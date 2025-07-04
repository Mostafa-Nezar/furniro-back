const express = require("express");
const router = express.Router();
const { client } = require("../config/paypal");
const paypal = require("@paypal/checkout-server-sdk");

// ✅ إنشاء أوردر باي بال
router.post("/create-paypal-order", async (req, res) => {
  const { total = "20.00" } = req.body;

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
    res.status(500).json({ error: "Failed to create PayPal order" });
  }
});

// ✅ تأكيد الدفع
router.post("/capture-paypal-order/:orderID", async (req, res) => {
  const { orderID } = req.params;

  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  try {
    const capture = await client().execute(request);

    console.log("✅ Payment Captured:", capture.result);

    res.status(200).json({
      success: true,
      data: capture.result,
    });
  } catch (err) {
    console.error("❌ Capture failed:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;

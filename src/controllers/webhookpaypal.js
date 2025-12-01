const { client } = require("../config/paypal");
const paypal = require("@paypal/checkout-server-sdk");
const NotificationService = require("../utils/notificationService");

// ✅ Create PayPal order
exports.createPaypalOrder = async (req, res) => {
  const { total, userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: total || "20.00",
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

    await NotificationService.createNotification(
      userId,
      `PayPal #${order.result.id} payment request`
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
    res.status(500).json({ error: "payment request failure" });
  }
};

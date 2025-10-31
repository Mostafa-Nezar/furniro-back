const fetch = require("node-fetch");
const Order = require('../models/order');
const NotificationService = require("../utils/notificationService");
const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_API_BASE } = process.env;
const generateAccessToken = async () => {
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "MyApp/1.0 (Node.js)" // أضف هذا السطر
      },
    });
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Failed to generate PayPal 2 Access Token:", error);
    throw new Error("Could not generate PayPal 2 access token.");
  }
};

const paypalController = {

  /**
   * @description إنشاء أمر دفع جديد في PayPal
   * @route       POST /api/paypal2/orders
   */
  createOrder: async (req, res) => {
    const { total, userId, products, customerInfo } = req.body;

    if (!total || !userId || !products || !customerInfo) {
      return res.status(400).json({ error: "Missing required order data." });
    }

    try {
      const accessToken = await generateAccessToken();
      const url = `${PAYPAL_API_BASE}/v2/checkout/orders`;
      
      const payload = {
        intent: "CAPTURE",
        purchase_units: [{
          amount: {
            currency_code: "USD",
            value: total.toString(),
          },
          custom_id: `order-${Date.now()}`
        }],
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      res.status(response.status).json(data);

    } catch (error) {
      console.error("Failed to create PayPal 2 order:", error);
      res.status(500).json({ error: "Failed to create order." });
    }
  },

  /**
   * @description تأكيد الدفع وحفظ الطلب في قاعدة البيانات
   * @route       POST /api/paypal2/orders/:orderID/capture
   */
  captureOrder: async (req, res) => {
    const { orderID } = req.params;
    try {
      const accessToken = await generateAccessToken();
      const url = `${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      });

      const paypalData = await response.json();

      if (paypalData.status === 'COMPLETED') {
        console.log(`(PayPal 2) Payment for Order ${paypalData.id} completed successfully.`);

        const purchaseUnit = paypalData.purchase_units[0];
        const { userId, products, customerInfo, total } = JSON.parse(purchaseUnit.custom_id);

        const orderData = {
          userId: userId,
          products: products,
          date: new Date(paypalData.create_time),
          total: parseFloat(purchaseUnit.amount.value),
          payment: {
            method: 'paypal',
            id: paypalData.id,
            status: paypalData.status,
          },
          customerInfo: customerInfo,
          status: "paid"
        };

        const newOrder = new Order(orderData);
        await newOrder.save();
        console.log(`✅ Order ${newOrder._id} (from PayPal) has been successfully saved.`);
        req.io.emit("productsChanged");

        if (userId) {
          await NotificationService.notifyPaymentSuccess(userId, newOrder._id, "paypal", newOrder.total);
        }
      }

      res.status(response.status).json(paypalData);

    } catch (error) {
      console.error("Failed to capture PayPal 2 order or save to DB:", error);
      res.status(500).json({ error: "Failed to capture order." });
    }
  }
};

module.exports = paypalController;

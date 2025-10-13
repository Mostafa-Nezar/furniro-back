const braintree = require("braintree");
const Order = require("../models/order");
const NotificationService = require("../utils/notificationService");

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY
});

const getToken = async (req, res) => {
  try {
    const response = await gateway.clientToken.generate({});
    res.json({ clientToken: response.clientToken });
  } catch (error) {
    console.error("Braintree token error:", error);
    res.status(500).json({ error: error.message });
  }
};

const checkout = async (req, res) => {
  const { paymentMethodNonce, amount, userId, products, customerInfo } = req.body;

  try {
    const result = await gateway.transaction.sale({
      amount,
      paymentMethodNonce,
      options: { submitForSettlement: true }
    });

    if (result.success || result.transaction) {
      const orderData = {
        userId,
        products,
        total: parseFloat(amount),
        payment: {
          method: "braintree",
          id: result.transaction?.id || null,
          status: result.transaction?.status || "success"
        },
        customerInfo,
        status: "paid",
        date: new Date()
      };

      const newOrder = new Order(orderData);
      await newOrder.save();

      if (userId) {
        await NotificationService.notifyPaymentSuccess(userId, newOrder._id, "braintree", newOrder.total);
      }

      res.json({ success: true, transaction: result.transaction, order: newOrder });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (error) {
    console.error("Braintree checkout error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getToken, checkout };

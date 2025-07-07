const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/order");
const Product = require("../models/product");
const NotificationService = require("../utils/notificationService");

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// ⚠️ IMPORTANT: only `"/"` here, because full path is declared in index.js
router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`❌ Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;

    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ["data.price.product"],
      });

      const productsInOrder = lineItems.data.map((item) => ({
        productId: item.price.product.metadata.productId,
        quantity: item.quantity,
        price: item.price.unit_amount / 100,
        name: item.price.product.name,
      }));

      const newOrder = {
        stripeSessionId: session.id,
        email: session.customer_details?.email,
        name: session.customer_details?.name,
        address: session.customer_details?.address,
        amount: session.amount_total / 100,
        paymentStatus: session.payment_status,
        products: productsInOrder,
        createdAt: new Date(session.created * 1000).toISOString(),
      };

      const existingOrder = await Order.findOne({ stripeSessionId: newOrder.stripeSessionId });

      if (!existingOrder) {
        const savedOrder = await Order.create(newOrder);

        for (const item of productsInOrder) {
          await Product.findOneAndUpdate(
            { id: item.productId },
            { $inc: { quantity: -item.quantity } }
          );
        }

        if (userId) {
          await NotificationService.notifyPaymentSuccess(userId, savedOrder._id, savedOrder.amount);
        }

        console.log("✅ Order saved and notification sent");
      } else {
        console.log("⚠️ Duplicate order");
      }
    } catch (error) {
      console.error("❌ Failed to save order or send notification:", error.message);
    }
  }

  res.json({ received: true });
});

module.exports = router;
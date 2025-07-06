const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/order"); // موديل الطلبات
const Product = require("../models/product"); // موديل المنتجات

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Retrieve line items from the session
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { expand: ['data.price.product'] });

      const productsInOrder = lineItems.data.map(item => ({
        productId: item.price.product.metadata.productId, // Assuming you store product ID in metadata
        quantity: item.quantity,
        price: item.price.unit_amount / 100,
        name: item.price.product.name
      }));

      const newOrder = {
        stripeSessionId: session.id,
        email: session.customer_details?.email,
        name: session.customer_details?.name,
        address: session.customer_details?.address,
        amount: session.amount_total / 100,
        paymentStatus: session.payment_status,
        products: productsInOrder, // Add products to the order
        createdAt: new Date(session.created * 1000).toISOString(),
      };

      try {
        const existingOrder = await Order.findOne({ stripeSessionId: newOrder.stripeSessionId });

        if (!existingOrder) {
          await Order.create(newOrder);
          console.log("✅ Order saved to MongoDB");

          // Decrease product quantities
          for (const item of productsInOrder) {
            await Product.findOneAndUpdate(
              { id: item.productId },
              { $inc: { quantity: -item.quantity } }
            );
          }
          console.log("✅ Product quantities decreased");

        } else {
          console.log("⚠️ Duplicate order, not saved again.");
        }
      } catch (error) {
        console.error("❌ Error saving order to MongoDB:", error);
      }
    }

    res.json({ received: true });
  }
);

module.exports = router;



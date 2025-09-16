
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const NotificationService = require("../utils/notificationService");
const Order = require('../models/order'); 

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_2;

exports.handleStripeWebhook2 = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`❌ Webhook (Intent) Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    console.log("✅ Received payment_intent.succeeded event.");

    try {
      const userId = paymentIntent.metadata.userId;
      const customerName = paymentIntent.metadata.customerName;
      const productsInOrder = JSON.parse(paymentIntent.metadata.products || '[]');

      const orderData = {
        userId: userId,
        products: productsInOrder,
        date: new Date(paymentIntent.created * 1000),
        total: paymentIntent.amount / 100,
        payment: {
          method: 'stripe_intent',
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status, 
        },
        shippingAddress: {
            name: customerName,
            address: paymentIntent.shipping?.address
        }
      };

      const newOrder = new Order(orderData);
      await newOrder.save();
      console.log(`✅ Order ${newOrder._id} (from Intent) has been successfully saved.`);

      if (userId) {
        await NotificationService.notifyPaymentSuccess(userId, newOrder._id, newOrder.total);
      }

    } catch (error) {
      console.error("❌ Critical Error (Intent): Failed to process and save order:", error.message);
    }
  } else {
    console.log(`Received unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};

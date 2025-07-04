const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order'); // موديل الطلبات

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      const newOrder = {
        stripeSessionId: session.id,
        email: session.customer_details?.email,
        name: session.customer_details?.name,
        address: session.customer_details?.address,
        amount: session.amount_total / 100,
        paymentStatus: session.payment_status,
        createdAt: new Date(session.created * 1000).toISOString(),
      };

      try {
        const existingOrder = await Order.findOne({ stripeSessionId: newOrder.stripeSessionId });

        if (!existingOrder) {
          await Order.create(newOrder);
          console.log('✅ Order saved to MongoDB');
        } else {
          console.log('⚠️ Duplicate order, not saved again.');
        }
      } catch (error) {
        console.error('❌ Error saving order to MongoDB:', error);
      }
    }

    res.json({ received: true });
  }
);

module.exports = router;

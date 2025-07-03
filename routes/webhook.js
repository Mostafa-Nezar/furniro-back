const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs');
const path = require('path');

const ordersFilePath = path.join(__dirname, '../data/orders.json');
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
        let orders = [];

        if (fs.existsSync(ordersFilePath)) {
          const existingData = fs.readFileSync(ordersFilePath);
          orders = JSON.parse(existingData);
        }

        const isDuplicate = orders.some(
          (order) => order.stripeSessionId === newOrder.stripeSessionId
        );

        if (!isDuplicate) {
          orders.push(newOrder);
          fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2));
          console.log('✅ Order saved locally');
        } else {
          console.log('⚠️ Duplicate order, not saved again.');
        }
      } catch (error) {
        console.error('❌ Error saving order:', error);
      }
    }

    res.json({ received: true });
  }
);

module.exports = router;

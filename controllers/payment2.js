const dotenv = require("dotenv");
dotenv.config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY_2);

exports.createPaymentIntent = async (req, res) => {
  try {
    const { total, userId, products, customerInfo } = req.body;

    if (total == null || total <= 0) {
      return res.status(400).json({ error: 'Total amount is required and must be greater than 0.' });
    }

    const amountInCents = Math.round(total * 100);

    const metadata = {
      userId: userId,
      products: JSON.stringify(products.map(p => ({ name: p.name, quantity: p.quantity }))),
      customerName: customerInfo.name,
    };

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true }, 
      metadata: metadata,
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });

  } catch (error) {
    console.error("❌ Create Payment Intent Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};


const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
dotenv.config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
  const { userId, products, customerInfo } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: products.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            metadata: { productId: item.id },
          },
          unit_amount: item.price * 100,
        },
        quantity: item.quantity,
      })),
      success_url: `https://your-domain.com/success`,
      cancel_url: `https://your-domain.com/cancel`,
      metadata: {
        userId,
      },
      customer_email: customerInfo.email,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe Error:", error.message);
    res.status(500).json({ error: "فشل في إنشاء رابط الدفع" });
  }
});

module.exports = router;

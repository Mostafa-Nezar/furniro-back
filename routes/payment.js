// routes/create-checkout-session.js
const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
dotenv.config(); 

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "منتج تجريبي",
            },
            unit_amount: 2000,
          },
          quantity: 1,
        },
      ],
      success_url: "https://example.com/success",
      cancel_url: "https://example.com/cancel",
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error.message);
    res.status(500).json({ error: "فشل في إنشاء رابط الدفع" });
  }
});

module.exports = router;

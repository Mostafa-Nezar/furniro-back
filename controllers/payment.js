const dotenv = require("dotenv");
dotenv.config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.createCheckoutSession = async (req, res) => {
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
      success_url: `https://furniro-react-jade.vercel.app`,
      cancel_url: `https://furniro-react-jade.vercel.app`,
            metadata: {
        userId,
        fullName: customerInfo.fullName,
        email: customerInfo.email,
        address: customerInfo.address,
        city: customerInfo.city,
        state: customerInfo.state,
        zipCode: customerInfo.zipCode,
      },
      customer_email: customerInfo.email,
      shipping_address_collection: {
        allowed_countries: ["EG", "US"], 
      },
      customer_email: customerInfo.email,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe Error:", error.message);
    res.status(500).json({ error: "payment failure" });
  }
};

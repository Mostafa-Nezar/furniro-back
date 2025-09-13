
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const NotificationService = require("../utils/notificationService");
const Order = require('../models/order'); // تأكد من صحة المسار

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`❌ Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // تعامل فقط مع حدث اكتمال الجلسة
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;

    try {
      // 1. استرجع تفاصيل المنتجات من الجلسة
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ["data.price.product"],
      });

      const productsInOrder = lineItems.data.map((item) => ({
        productId: item.price.product.metadata.productId,
        quantity: item.quantity,
        price: item.price.unit_amount / 100,
        name: item.price.product.name,
      }));

      // 2. جهّز بيانات الطلب الكاملة للحفظ
      const orderData = {
        userId: userId,
        products: productsInOrder,
        date: new Date(session.created * 1000),
        total: session.amount_total / 100,
        payment: {
          method: 'stripe',
          paymentIntentId: session.payment_intent,
          status: session.payment_status,
          stripeSessionId: session.id
        },
        shippingAddress: {
            name: session.customer_details?.name,
            address: session.customer_details?.address
        }
      };

      // 3. أنشئ الطلب واحفظه في قاعدة البيانات
      const newOrder = new Order(orderData);
      await newOrder.save();
      console.log(`✅ Order ${newOrder._id} has been successfully saved to the database.`);

      // 4. أرسل إشعارًا للمستخدم بالنجاح (مع رقم الطلب الحقيقي)
      if (userId) {
        await NotificationService.notifyPaymentSuccess(userId, newOrder._id, newOrder.total);
      }

    } catch (error) {
      console.error("❌ Critical Error: Failed to process session and save order:", error.message);
      // في تطبيق حقيقي، يجب إرسال تنبيه للمطور هنا لأن المال تم استلامه لكن الطلب لم يحفظ
    }
  }

  // أرسل استجابة ناجحة إلى Stripe لتأكيد استلام الـ Webhook
  res.json({ received: true });
};

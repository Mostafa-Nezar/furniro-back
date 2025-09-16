const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const NotificationService = require("../utils/notificationService");
const Order = require('../models/order'); 

// تأكد من أن هذا المتغير يقرأ المفتاح الصحيح من ملف .env
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_2;

exports.handleStripeWebhook2 = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  // --- الخطوة 1: التحقق من التوقيع ---
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    // إذا فشل التحقق، أرسل خطأ 400 إلى Stripe وأوقف التنفيذ
    console.error(`❌ Webhook Signature Verification Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // --- الخطوة 2: التعامل مع حدث الدفع الناجح ---
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    console.log("✅ Received 'payment_intent.succeeded' event for PI: ", paymentIntent.id);

    // --- الخطوة 3: معالجة الطلب داخل كتلة try...catch ---
    try {
      // 3.1: استرجع البيانات من الـ metadata
      // (استخدم Optional Chaining '?' لتجنب الأخطاء إذا كانت البيانات غير موجودة)
      const userId = paymentIntent.metadata?.userId;
      const productsMetadata = paymentIntent.metadata?.products;
      
      // تحقق من وجود البيانات الأساسية قبل المتابعة
      if (!userId || !productsMetadata) {
        throw new Error(`Webhook Error: Missing metadata. UserID: ${userId}, Products: ${productsMetadata}`);
      }

      const productsInOrder = JSON.parse(productsMetadata);

      // 3.2: استرجع تفاصيل العميل من كائن PaymentIntent
      const customerDetails = {
        name: paymentIntent.billing_details?.name || paymentIntent.shipping?.name,
        email: paymentIntent.billing_details?.email,
        address: paymentIntent.billing_details?.address || paymentIntent.shipping?.address,
      };

      // 3.3: جهّز كائن payment المفصل
      const paymentData = {
        method: 'stripe_intent',
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status, // ستكون 'succeeded'
      };

      // 3.4: جهّز بيانات الطلب الكاملة للحفظ
      const orderData = {
        userId: userId,
        products: productsInOrder,
        date: new Date(paymentIntent.created * 1000),
        total: paymentIntent.amount / 100,
        payment: paymentData,
        shippingAddress: customerDetails.address,
      };

      // 3.5: أنشئ الطلب واحفظه في قاعدة البيانات
      const newOrder = new Order(orderData);
      await newOrder.save();
      console.log(`✅ Order ${newOrder._id} (from Intent) has been successfully saved.`);

      // 3.6: أرسل إشعارًا للمستخدم بالنجاح
      if (userId) {
        await NotificationService.notifyPaymentSuccess(userId, newOrder._id, newOrder.total);
        console.log(`✅ Notification sent to user ${userId}.`);
      }

      // --- الخطوة 4: أرسل استجابة النجاح إلى Stripe ---
      // يتم إرسالها فقط إذا نجحت كل الخطوات السابقة
      console.log("✅ Webhook processed successfully. Sending 200 OK to Stripe.");
      return res.status(200).json({ received: true });

    } catch (error) {
      // --- الخطوة 5: معالجة أي خطأ يحدث داخل كتلة try ---
      // هذا هو الجزء الأهم لكشف المشكلة
      console.error("❌ CRITICAL ERROR: Failed to process webhook and save order:", error);
      
      // أرسل استجابة خطأ 500 إلى Stripe
      // هذا سيجعل Stripe يسجل المحاولة على أنها "Failed" بشكل صحيح
      // وسيخبرك بوجود مشكلة حقيقية في الخادم
      return res.status(500).json({ error: "Internal server error while processing webhook." });
    }
  } else {
    // إذا كان الحدث ليس هو ما نهتم به، أرسل استجابة نجاح لتجاهله
    console.log(`Received and ignored unhandled event type: ${event.type}`);
    return res.status(200).json({ received: true, message: "Unhandled event type" });
  }
};

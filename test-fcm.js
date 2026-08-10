require('dotenv').config();
const { getMessaging } = require('./src/utils/firebase');

async function testFCM() {
  const testToken = process.env.FCM_TOKEN;

  if (!testToken) {
    console.log("❌ لم يتم العثور على FCM_TOKEN في ملف .env");
    return;
  }

  const payload = {
    notification: {
      title: "تجربة إشعار 🚀",
      body: "هذا إشعار تجريبي من الباك إند.. هل رن الصوت؟",
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'high_importance_channel',
        defaultSound: true,
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default'
        }
      }
    },
    token: testToken
  };

  try {
    console.log("⏳ جاري إرسال الإشعار...");
    const response = await getMessaging().send(payload);
    console.log("✅ تم إرسال الإشعار بنجاح! كود العملية:", response);
  } catch (error) {
    console.error("❌ خطأ أثناء إرسال الإشعار:", error.message);
  }
}

testFCM();

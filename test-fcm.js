require('dotenv').config();

const { getMessaging } = require('./src/utils/firebase');

async function testFCM() {
  const testToken = process.env.FCM_TOKEN;

  if (!testToken) {
    console.log('❌ لم يتم العثور على FCM_TOKEN في ملف .env');
    return;
  }

  // استبدل هذا الرقم بعدد الإشعارات غير المقروءة الحقيقي من قاعدة البيانات
  const unreadCount = 5;

  const payload = {
    notification: {
      title: 'تجربة إشعار 🚀',
      body: `هذا إشعار تجريبي من الباك إند.. هل رن الصوت؟ ${unreadCount}`,
    },

    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'furniro_notifications',
        notificationCount: unreadCount,
        defaultSound: true,
      },
    },

    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: unreadCount,
        },
      },
    },

    data: {
      badge: String(unreadCount),
      unreadCount: String(unreadCount),
    },

    token: testToken,
  };

  try {
    console.log('⏳ جاري إرسال الإشعار...');

    const response = await getMessaging().send(payload);

    console.log('✅ تم إرسال الإشعار بنجاح! كود العملية:', response);
    console.log(`🔢 عدد الإشعارات غير المقروءة: ${unreadCount}`);
  } catch (error) {
    console.error('❌ خطأ أثناء إرسال الإشعار:', error.message);
  }
}

testFCM();

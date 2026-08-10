const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const path = require('path');

// Initialize Firebase Admin SDK
try {
  const serviceAccount = require(path.join(__dirname, '../../furniro-flutter-27576-firebase-adminsdk-fbsvc-a161fc431f.json'));
  initializeApp({
    credential: cert(serviceAccount)
  });
  console.log('✅ Firebase Admin Initialized Successfully');
} catch (error) {
  console.error('❌ Error Initializing Firebase Admin:', error.message);
}

module.exports = { getMessaging };

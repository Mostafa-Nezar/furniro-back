const Notification = require('../models/notification');
const User = require('../models/user');
const { getMessaging } = require('./firebase');

class NotificationService {
    static io = null;

    static setSocketIO(socketIO) {
        this.io = socketIO;
    }

    static async createNotification(userId, title, message) {
        try {
            const notification = new Notification({ userId, title, message });
            await notification.save();

            if (this.io) {
                this.io.to(`user_${userId}`).emit('newNotification', {
                    _id: notification._id,
                    title: notification.title,
                    message: notification.message,
                    read: notification.read,
                    createdAt: notification.createdAt
                });
            }

            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    static async notifyWelcome(userId, userName) {
        const title = 'Welcome to Furniro';
        const message = `Welcome to Furniro, ${userName}! Thank you for joining us.`;
        return await this.createNotification(userId, title, message);
    }

    static async notifyProductBackInStock(productName) {
        const users = await User.find();
        const title = `${productName} is back in stock`;
        const message = `Good news! ${productName} is back in stock. Order now before it runs out again!`;
        const testToken = process.env.FCM_TOKEN;
        const payload = {
            notification: { title, body: message },
            android: { priority: 'high', notification: { sound: 'default', channelId: 'high_importance_channel', defaultSound: true } },
            apns: { payload: { aps: { sound: 'default' } } },
            token: testToken
        };
        await getMessaging().send(payload);
        return await Promise.allSettled(users.map(user => this.createNotification(user.id, title, message)));
    }

    static async notifyPaymentSuccess(userId, orderId, paymentMethod, amount) {
        const title = 'Payment success';
        const message = `Payment of $${amount} for order #${orderId} ${paymentMethod} has been processed successfully.`;
        return await this.createNotification(userId, title, message);
    }

    static async notifyShipping(userId, orderId, trackingNumber) {
        const title = 'Order shipped';
        const message = `Your order #${orderId} has been shipped! Tracking number: ${trackingNumber}`;
        return await this.createNotification(userId, title, message);
    }

}

module.exports = NotificationService;

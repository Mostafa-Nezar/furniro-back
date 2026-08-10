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
            const notification = new Notification({
                userId,
                title,
                message
            });
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

    static async createBulkNotifications(userIds, title, message) {
        try {
            const mongoose = require('mongoose');
            const Counter = mongoose.model('Counter');

            const counter = await Counter.findOneAndUpdate(
                { name: "notificationId" },
                { $inc: { value: userIds.length } },
                { new: true, upsert: true }
            );

            const startId = counter.value - userIds.length + 1;

            const notifications = userIds.map((userId, index) => ({
                notificationId: startId + index,
                userId,
                title,
                message
            }));
            const savedNotifications = await Notification.insertMany(notifications);

            if (this.io) {
                savedNotifications.forEach(notification => {
                    this.io.to(`user_${notification.userId}`).emit('newNotification', {
                        _id: notification._id,
                        message: notification.message,
                        read: notification.read,
                        createdAt: notification.createdAt
                    });
                });
            }

            return savedNotifications;
        } catch (error) {
            console.error('Error creating bulk notifications:', error);
            throw error;
        }
    }

    static async notifyWelcome(userId, userName) {
        const title = 'Welcome to Furniro';
        const message = `Welcome to Furniro, ${userName}! Thank you for joining us.`;
        return await this.createNotification(userId, title, message);
    }

    static async notifyProductBackInStock(productName) {
        const title = 'Product added';
        const message = `Good news! ${productName} is now available. Order now before it runs out!`;

        try {
            const users = await User.find({}, "id fcmToken").lean();
            const userIds = users.map(user => user.id).filter(id => id != null);
            
            const tokens = users.map(user => user.fcmToken).filter(token => token);
            if (process.env.FCM_TOKEN && !tokens.includes(process.env.FCM_TOKEN)) {
                tokens.push(process.env.FCM_TOKEN);
            }

            if (tokens.length > 0) {
                const chunkSize = 500;
                for (let i = 0; i < tokens.length; i += chunkSize) {
                    const chunk = tokens.slice(i, i + chunkSize);
                    const payload = {
                        notification: { title, body: message },
                        android: { priority: 'high', notification: { sound: 'default', channelId: 'high_importance_channel', defaultSound: true } },
                        apns: { payload: { aps: { sound: 'default' } } },
                        tokens: chunk
                    };
                    try {
                        const response = await getMessaging().sendEachForMulticast(payload);
                        console.log(`✅ FCM push sent to ${response.successCount} devices, failed for ${response.failureCount} devices.`);
                    } catch (fcmError) {
                        console.error('❌ Error sending FCM multicast chunk:', fcmError);
                    }
                }
            } else {
                console.log('⚠️ No FCM tokens found to send back in stock notification.');
            }

            if (userIds.length > 0) {
                await this.createBulkNotifications(userIds, title, message);
            }
        } catch (error) {
            console.error('Error in notifyProductBackInStock:', error);
        }
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

    static async sendFCM(userId, title, body) {
        try {
            let user;
            const isObjectId = typeof userId === 'string' && /^[0-9a-fA-F]{24}$/.test(userId);

            if (isObjectId) {
                user = await User.findById(userId);
            } else {
                user = await User.findOne({ id: Number(userId) });
            }

            if (user) {
                const token = user.fcmToken || process.env.FCM_TOKEN;

                if (token) {
                    const payload = {
                        notification: { title, body },
                        android: { priority: 'high', notification: { sound: 'default', channelId: 'high_importance_channel', defaultSound: true } },
                        apns: { payload: { aps: { sound: 'default' } } },
                        token
                    };
                    await getMessaging().send(payload);
                    console.log(`✅ FCM push sent successfully to user ${userId}`);
                } else {
                    console.log(`⚠️ No FCM token found for user ${userId}, and no FCM_TOKEN in .env`);
                }
            } else {
                console.log(`⚠️ User ${userId} not found, cannot send FCM`);
            }
        } catch (error) {
            console.error('❌ Error sending FCM:', error.message);
        }
    }

    static async sendFCMToTopic(topic, title, body) {
        try {
            const payload = {
                notification: { title, body },
                android: { priority: 'high', notification: { sound: 'default', channelId: 'high_importance_channel', defaultSound: true } },
                apns: { payload: { aps: { sound: 'default' } } },
                topic: topic
            };
            await getMessaging().send(payload);
            console.log(`✅ FCM push sent successfully to topic ${topic}`);
        } catch (error) {
            console.error(`❌ Error sending FCM to topic ${topic}:`, error.message);
        }
    }

    static async notifyProductBackInStockold(userId, productName) {
        const title = 'Product back in stock';
        const message = `Good news! ${productName} is back in stock. Order now before it runs out again!`;
        await this.sendFCM(userId, title, message);
        return await this.createNotification(userId, title, message);
    }

}

module.exports = NotificationService;
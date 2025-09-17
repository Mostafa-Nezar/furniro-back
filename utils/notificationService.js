const Notification = require('../models/notification');

class NotificationService {
    static io = null;
    
    static setSocketIO(socketIO) {
        this.io = socketIO;
    }

    static async createNotification(userId, message) {
        try {
            const notification = new Notification({
                userId,
                message
            });
            await notification.save();
            
            if (this.io) {
                this.io.to(`user_${userId}`).emit('newNotification', {
                    _id: notification._id,
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

    static async createBulkNotifications(userIds, message) {
        try {
            const notifications = userIds.map(userId => ({
                userId,
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
        const message = `Welcome to Furniro, ${userName}! Thank you for joining us.`;
        return await this.createNotification(userId, message);
    }

    static async notifyProductBackInStock(userId, productName) {
        const message = `Good news! ${productName} is back in stock. Order now before it runs out again!`;
        return await this.createNotification(userId, message);
    }

    static async notifyPaymentSuccess(userId, orderId, paymentMethod,  amount) {
        const message = `Payment of $${amount} for order #${orderId} ${paymentMethod} has been processed successfully.`;
        return await this.createNotification(userId, message);
    }

    static async notifyShipping(userId, orderId, trackingNumber) {
        const message = `Your order #${orderId} has been shipped! Tracking number: ${trackingNumber}`;
        return await this.createNotification(userId, message);
    }

}

module.exports = NotificationService;


const Notification = require('../models/notification');

class NotificationService {
    // Create a notification for a specific user
    static async createNotification(userId, message) {
        try {
            const notification = new Notification({
                userId,
                message
            });
            await notification.save();
            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    // Create notifications for multiple users
    static async createBulkNotifications(userIds, message) {
        try {
            const notifications = userIds.map(userId => ({
                userId,
                message
            }));
            await Notification.insertMany(notifications);
            return notifications;
        } catch (error) {
            console.error('Error creating bulk notifications:', error);
            throw error;
        }
    }

    // Order status update notification
    static async notifyOrderStatusUpdate(userId, orderId, status) {
        const message = `Your order #${orderId} status has been updated to: ${status}`;
        return await this.createNotification(userId, message);
    }

    // Welcome notification for new users
    static async notifyWelcome(userId, userName) {
        const message = `Welcome to Furniro, ${userName}! Thank you for joining us.`;
        return await this.createNotification(userId, message);
    }

    // Product back in stock notification
    static async notifyProductBackInStock(userId, productName) {
        const message = `Good news! ${productName} is back in stock. Order now before it runs out again!`;
        return await this.createNotification(userId, message);
    }

    // Order confirmation notification
    static async notifyOrderConfirmation(userId, orderId, totalAmount) {
        const message = `Your order #${orderId} has been confirmed. Total amount: $${totalAmount}. Thank you for your purchase!`;
        return await this.createNotification(userId, message);
    }

    // Payment successful notification
    static async notifyPaymentSuccess(userId, orderId, amount) {
        const message = `Payment of $${amount} for order #${orderId} has been processed successfully.`;
        return await this.createNotification(userId, message);
    }

    // Shipping notification
    static async notifyShipping(userId, orderId, trackingNumber) {
        const message = `Your order #${orderId} has been shipped! Tracking number: ${trackingNumber}`;
        return await this.createNotification(userId, message);
    }

    // Delivery notification
    static async notifyDelivery(userId, orderId) {
        const message = `Your order #${orderId} has been delivered successfully. We hope you enjoy your purchase!`;
        return await this.createNotification(userId, message);
    }

    // Promotional notification
    static async notifyPromotion(userId, promoTitle, promoDetails) {
        const message = `${promoTitle}: ${promoDetails}`;
        return await this.createNotification(userId, message);
    }

    // Password change notification
    static async notifyPasswordChange(userId) {
        const message = `Your password has been changed successfully. If you didn't make this change, please contact support immediately.`;
        return await this.createNotification(userId, message);
    }

    // Account verification notification
    static async notifyAccountVerification(userId) {
        const message = `Your account has been verified successfully. You can now access all features.`;
        return await this.createNotification(userId, message);
    }
}

module.exports = NotificationService;


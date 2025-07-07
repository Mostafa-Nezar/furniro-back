const router = require("express").Router();
const Notification = require("../models/notification");
const NotificationService = require("../utils/notificationService");
const auth = require("../middleware/auth");

router.post("/test", auth, async (req, res) => {
  try {
    const message = req.body.message || "This is a test notification from Furniro!";
    
    console.log("🧪 Sending test notification to user:", req.user.id);
    
    const notification = await NotificationService.createNotification(
      req.user.id, 
      message
    );
    
    console.log("✅ Test notification created:", notification);
    
    res.json({
      success: true,
      message: "Test notification sent successfully",
      notification
    });
  } catch (err) {
    console.error("❌ Error sending test notification:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Server Error", 
      error: err.message 
    });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    console.log("📋 Getting notifications for user:", req.user.id);
    
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await Notification.countDocuments({ userId: req.user.id });
    const unreadCount = await Notification.countDocuments({ 
      userId: req.user.id, 
      read: false 
    });
    
    console.log(`📊 Found ${notifications.length} notifications, ${unreadCount} unread`);
    
    res.json({
      notifications,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      },
      unreadCount
    });
  } catch (err) {
    console.error("❌ Error getting notifications:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Server Error", 
      error: err.message 
    });
  }
});

// Get unread notifications count
router.get("/unread-count", auth, async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({ 
      userId: req.user.id, 
      read: false 
    });
    
    res.json({ unreadCount });
  } catch (err) {
    console.error("❌ Error getting unread count:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Server Error", 
      error: err.message 
    });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    let notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }

    if (notification.userId !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    notification.read = true;
    await notification.save();

    res.json({ msg: "Notification marked as read" });
  } catch (err) {
    console.error("❌ Error marking notification as read:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Server Error", 
      error: err.message 
    });
  }
});

router.put("/", auth, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );

    console.log(`✅ Marked ${result.modifiedCount} notifications as read for user ${req.user.id}`);

    res.json({ 
      msg: "All notifications marked as read",
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error("❌ Error marking all notifications as read:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Server Error", 
      error: err.message 
    });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }

    if (notification.userId !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({ msg: "Notification deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting notification:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Server Error", 
      error: err.message 
    });
  }
});

router.delete("/", auth, async (req, res) => {
  try {
    const result = await Notification.deleteMany({ 
      userId: req.user.id, 
      read: true 
    });

    console.log(`🗑️ Deleted ${result.deletedCount} read notifications for user ${req.user.id}`);

    res.json({ 
      msg: "All read notifications deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("❌ Error deleting read notifications:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Server Error", 
      error: err.message 
    });
  }
});

module.exports = router;


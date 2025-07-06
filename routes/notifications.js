
const router = require("express").Router();
const Notification = require("../models/notification");
const NotificationService = require("../utils/notificationService");
const auth = require("../middleware/auth");

// Send test notification
router.post("/test", auth, async (req, res) => {
  try {
    const message = req.body.message || "This is a test notification from Furniro!";
    
    const notification = await NotificationService.createNotification(
      req.user.id,
      message
    );
    
    res.json({
      success: true,
      message: "Test notification sent successfully",
      notification
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get all notifications for a user
router.get("/", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await Notification.countDocuments({ userId: req.user.id });
    const unreadCount = await Notification.countDocuments({ 
      userId: req.user.id, 
      read: false 
    });
    
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
    console.error(err.message);
    res.status(500).send("Server Error");
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
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Mark a notification as read
router.put("/:id", auth, async (req, res) => {
  try {
    let notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }

    // Ensure user owns the notification
    if (notification.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    notification.read = true;
    await notification.save();

    res.json({ msg: "Notification marked as read" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Mark all notifications as read
router.put("/", auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );

    res.json({ msg: "All notifications marked as read" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Delete a notification
router.delete("/:id", auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }

    // Ensure user owns the notification
    if (notification.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({ msg: "Notification deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Delete all read notifications
router.delete("/", auth, async (req, res) => {
  try {
    await Notification.deleteMany({ 
      userId: req.user.id, 
      read: true 
    });

    res.json({ msg: "All read notifications deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;



const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getNotifications,
  deleteNotification,
  markAllRead
} = require("../controllers/notifications");

router.get("/", auth, getNotifications);
router.delete("/:id", auth, deleteNotification);
router.put("/mark-all-read", auth, markAllRead);

module.exports = router;

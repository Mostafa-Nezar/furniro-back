const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const NotificationService = require("./utils/notificationService");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Set Socket.IO instance in NotificationService
NotificationService.setSocketIO(io);

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  require("./routes/webhook")
);

app.use(
  "/api/paypal/webhook",
  express.raw({ type: "application/json" }),
  require("./routes/webhookpaypal")
);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/upload", require("./routes/uploaduserimage"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/products/db", require("./routes/products"));
app.use("/api/ratings", require("./routes/ratings"));
app.use("/api/payment", require("./routes/payment")); 
app.use("/api/paypal", require("./routes/paypal"));  

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("👤 User connected:", socket.id);
  
  // Join user to their personal room for notifications
  socket.on("join", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} joined their notification room`);
  });
  
  // Handle marking notification as read
  socket.on("markNotificationRead", async (data) => {
    try {
      const { notificationId, userId } = data;
      // Emit to all user's connected devices
      io.to(`user_${userId}`).emit("notificationRead", { notificationId });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  });
  
  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("👤 User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

app.use("/api/admin", require("./routes/admin"));
app.use("/api/notifications", require("./routes/notifications"));



const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const NotificationService = require("./utils/notificationService");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require('compression');
dotenv.config();

const app = express();
const server = http.createServer(app);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(limiter);
app.use(compression());
app.use(helmet());

app.use(cors());
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path, stat) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));


const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

NotificationService.setSocketIO(io);

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

app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/upload", require("./routes/uploaduserimage"));
app.use("/api/products/db", require("./routes/products"));
app.use("/api/ratings", require("./routes/ratings"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/paypal", require("./routes/paypal"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/notifications", require("./routes/notifications"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.log("❌ MongoDB error:", err));

io.on("connection", (socket) => {
  console.log("👤 User connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} joined their notification room`);
  });

  socket.on("markNotificationRead", async (data) => {
    try {
      const { notificationId, userId } = data;
      io.to(`user_${userId}`).emit("notificationRead", { notificationId });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("👤 User disconnected:", socket.id);
  });
});
const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});
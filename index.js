const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

app.use("/api/admin", require("./routes/admin"));
app.use("/api/notifications", require("./routes/notifications"));


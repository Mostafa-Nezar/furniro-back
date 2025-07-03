const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const webhookRoute = require('./routes/webhook');
app.use("/api/payment/webhook", webhookRoute);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const auth = require("./routes/auth");
const products = require("./routes/products");
const ratingsRoutes = require("./routes/ratings");
const uploaduserimage = require('./routes/uploaduserimage');
const cart = require('./routes/cart');
const paymentRoute = require("./routes/payment");

app.use("/api/auth", auth);
app.use("/api/upload", uploaduserimage);
app.use("/api/cart", cart);
app.use("/api/products/db", products);
app.use("/api/ratings", ratingsRoutes);
app.use("/api/payment", paymentRoute); 

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB error:", err));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

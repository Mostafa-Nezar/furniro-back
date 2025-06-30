const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const productsDbRoutes = require("./routes/productsdb");
const ratingsRoutes = require("./routes/ratings"); // ✅
const uploadRoutes = require('./routes/uploadRoutes');
const userRoutes = require('./routes/userRoutes');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products/db", productsDbRoutes);
app.use("/api/ratings", ratingsRoutes); // ✅

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB error:", err));

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running at http://localhost:${process.env.PORT}`);
});

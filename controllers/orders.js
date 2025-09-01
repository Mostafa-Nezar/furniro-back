const Order = require("../models/order");

exports.createOrder = async (req, res) => {
  const { userId, products, date, total,payment } = req.body;
  if (!userId || !products || !date || total == null) return res.status(400).json({ error: "Missing fields" });
  try {
    const newOrder = new Order({ userId, products, date, total, payment });
    await newOrder.save();
    res.status(201).json({ message: "Order saved" });
  } catch (err) {
    console.error("❌ Error saving order:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getUserOrders = async (req, res) => {
  const { userId } = req.params;

  try {
    const orders = await Order.find({ userId: parseInt(userId) }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({ error: "Server error" });
  }
};

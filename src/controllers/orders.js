const Order = require("../models/order");

exports.createOrder = async (req, res) => {
  const {
    userId,
    products,
    date,
    total,
    payment,
    customerInfo,
    deliveryDate,
    userlocation
  } = req.body;

  if (!userId || !products || !date || total == null) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const orderData = {
      userId,
      products,
      date,
      total,
      payment: payment || { method: "cod", status: "pending" }, 
      customerInfo: customerInfo || {},
      status: "pending",
      paymentdone: "cash on delivery",
      deliveryDate: deliveryDate || new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
      userlocation: userlocation || "",
    };

    const newOrder = new Order(orderData);
    await newOrder.save();

    res.status(201).json({ message: "Order saved", orderId: newOrder._id });
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

exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ error: "Missing status" });

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(updatedOrder);
  } catch (err) {
    console.error("❌ Error updating order status:", err);
    res.status(500).json({ error: "Server error" });
  }
};


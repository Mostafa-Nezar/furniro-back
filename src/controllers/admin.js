const Admin = require("../models/admin");
const User = require("../models/user");
const Order = require("../models/order");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Product = require("../models/product");
const NotificationService = require("../utils/notificationService");
const JWT_SECRET = process.env.JWT_SECRET;
const getNextAdminId = async () => {
  const lastAdmin = await Admin.findOne().sort({ id: -1 });
  return lastAdmin ? lastAdmin.id + 1 : 1;
};



exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password, phoneNumber, location, role } = req.body;

    const exists = await Admin.findOne({ email });
    if (exists) return res.status(400).json({ msg: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      id: await getNextAdminId(),
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      location,
      role: role || "admin",
      permissions: role === "superadmin" ? ["all"] : [],
    });

    await newAdmin.save();

    // Create token
    const token = jwt.sign(
      { id: newAdmin.id, email: newAdmin.email, role: newAdmin.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      msg: "Admin registered successfully",
      admin: newAdmin,
      token,
    });

  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ msg: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid email or password" });

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      msg: "Login successful",
      admin,
      token,
    });

  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.logoutAdmin = (req, res) => {
  res.clearCookie("adminToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });
  res.json({ msg: "Admin logged out successfully" });
};



exports.addProduct = async (req, res) => {
  try {
    if (!req.body.name?.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    if (!req.body.price || isNaN(Number(req.body.price))) {
      return res.status(400).json({ success: false, message: "Valid price is required" });
    }

    const uploadedImages = req.files ? Object.values(req.files).flat().map(file => file.path) : [];
    const lastProduct = await Product.findOne().sort({ id: -1 }).select("id").lean();
    const nextId = lastProduct ? lastProduct.id + 1 : 1;
    const { key, name, price, salePrice, category, colors, sizes, quantity, sale, des, general, myproduct, dimensions, warranty, customAttributes } = req.body;

    const newProduct = new Product({
      id: nextId,
      images: uploadedImages,
      key, name, price, salePrice, category, colors, sizes, quantity, sale, des, general, myproduct, dimensions, warranty, customAttributes
    });

    await newProduct.save();
    res.status(201).json({ success: true, product: newProduct });
    setImmediate(async () => {
      const users = await User.find({}, "id").lean();
      await Promise.allSettled(users.map(user => NotificationService.notifyProductBackInStock(user.id, newProduct.name)));
    });
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

exports.adminUpdateProduct = async (req, res) => {
  try {
    if (!req.body.name?.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    if (!req.body.price || isNaN(Number(req.body.price))) {
      return res.status(400).json({ success: false, message: "Valid price is required" });
    }

    const uploadedImages = req.files?.map(file => file.path) || [];
    const { key, name, price, salePrice, category, colors, sizes, quantity, sale, des, general, myproduct, dimensions, warranty, customAttributes } = req.body;

    const updateData = Object.fromEntries(
      Object.entries({
        key, name, price, salePrice, category, colors, sizes, quantity, sale, des, general, myproduct, dimensions, warranty, customAttributes
      }).filter(([_, v]) => v !== undefined)
    );

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...updateData,
        ...(uploadedImages.length && { images: uploadedImages }),
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, product: updatedProduct });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProduct = await Product.findOneAndDelete({ id: id });

    if (!deletedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, message: "Product deleted successfully", product: deletedProduct });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};





exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user", error: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (err) {
    console.error("❌ Error fetching orders:", err.message);
    res.status(500).json({ message: "Error fetching orders", error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["refused", "shipping", "delivered", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error("❌ Error updating order status:", err.message);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json({ message: "Order deleted successfully", orderId: id });
  } catch (error) {
    console.error("❌ Error deleting order:", error.message);
    res.status(500).json({ error: "Server error while deleting order" });
  }
};



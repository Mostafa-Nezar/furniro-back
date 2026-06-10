const Admin = require("../models/admin");
const User = require("../models/user");
const Order = require("../models/order");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Product = require("../models/product");
const NotificationService = require("../utils/notificationService");
const JWT_SECRET = process.env.JWT_SECRET;

const parseJSONField = (str, fieldName, defaultValue = {}) => {
  if (str === undefined || str === null || str === "") return defaultValue;
  try {
    return JSON.parse(str);
  } catch {
    throw new Error(`Invalid JSON for ${fieldName}`);
  }
};

const parseNumberField = (value, fieldName, defaultValue = 0) => {
  if (value === undefined || value === null || value === "") return defaultValue;
  const number = Number(value);
  if (Number.isNaN(number)) {
    throw new Error(`Invalid number for ${fieldName}`);
  }
  return number;
};

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

    res.json({
      msg: "Login successful",
      admin,
      token,
    });

  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const body = req.body;
    const files = req.files;

    const uploadedImages = {};
    for (let key of ["image", "image1", "image2", "image3", "image4"]) {
      if (files[key]) {
        uploadedImages[key] = files[key][0].path;
      }
    }

    const lastProduct = await Product.findOne().sort({ id: -1 }).select("id").lean();
    const nextId = lastProduct ? lastProduct.id + 1 : 1;

    const name = body.name?.trim();
    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    if (body.price === undefined || body.price === "") {
      return res.status(400).json({ success: false, message: "Price is required" });
    }

    const price = parseNumberField(body.price, "price");
    const sale = parseNumberField(body.sale, "sale", 0);
    const averagerate = parseNumberField(body.averagerate, "averagerate", 0);
    const ratecount = parseNumberField(body.ratecount, "ratecount", 0);
    const variants = parseJSONField(body.variants, "variants", []);
    const quantity = parseNumberField(body.quantity, "quantity", 0);

    const newProduct = new Product({
      id: nextId,
      _id: nextId,
      key: body.key?.trim(),
      name,
      price,
      des: body.des?.trim() || "",
      category: body.category?.trim() || "",
      general: parseJSONField(body.general, "general", {
        salespackage: "",
        model: "",
        secoundary: "",
        configuration: "",
        upholsterymaterial: "",
        upholsterycolor: "",
      }),
      myproduct: parseJSONField(body.myproduct, "myproduct", {
        filingmaterial: "",
        finishtype: "",
        adjustheaderest: "",
        maxmumloadcapcity: "",
        originalofmanufacture: "",
      }),
      dimensions: parseJSONField(body.dimensions, "dimensions", {
        width: "",
        height: "",
        depth: "",
        weight: "",
        seatheight: "",
        legheight: "",
      }),
      warranty: parseJSONField(body.warranty, "warranty", {
        summry: "",
        servicetype: "",
        dominstic: "",
        covered: "",
        notcovered: "",
      }),
      customAttributes: parseJSONField(body.customAttributes, "customAttributes", {}),
      sale,
      averagerate,
      ratecount,
      variants,
      quantity,
      ...uploadedImages
    });


    await newProduct.save();
    const users = await User.find({}, "id");
    await Promise.all(
      users.map(user =>
        NotificationService.notifyProductBackInStock(
          user.id,
          newProduct.name
        )
      )
    );
    res.status(201).json({ success: true, product: newProduct });
  } catch (err) {
    console.error(err);
    if (err.message.includes("Invalid JSON") || err.message.includes("Invalid number")) {
      return res.status(400).json({ success: false, message: err.message });
    }
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

exports.adminUpdateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const body = req.body;
    const files = req.files;

    const uploadedImages = {};
    for (let key of ["image", "image1", "image2", "image3", "image4"]) {
      if (files && files[key]) {
        uploadedImages[key] = files[key][0].path;
      }
    }

    const existingProduct = await Product.findOne({ id: Number(productId) });
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: "المنتج غير موجود" });
    }

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) {
        return res.status(400).json({ success: false, message: "Name is required" });
      }
      existingProduct.name = name;
    }
    if (body.price !== undefined) {
      existingProduct.price = parseNumberField(body.price, "price", existingProduct.price);
    }
    if (body.des !== undefined) {
      existingProduct.des = body.des.trim();
    }
    if (body.key !== undefined) {
      existingProduct.key = body.key?.trim();
    }
    if (body.general !== undefined) {
      existingProduct.general = parseJSONField(body.general, "general", existingProduct.general);
    }
    if (body.myproduct !== undefined) {
      existingProduct.myproduct = parseJSONField(body.myproduct, "myproduct", existingProduct.myproduct);
    }
    if (body.dimensions !== undefined) {
      existingProduct.dimensions = parseJSONField(body.dimensions, "dimensions", existingProduct.dimensions);
    }
    if (body.warranty !== undefined) {
      existingProduct.warranty = parseJSONField(body.warranty, "warranty", existingProduct.warranty);
    }
    if (body.customAttributes !== undefined) {
      existingProduct.customAttributes = parseJSONField(body.customAttributes, "customAttributes", existingProduct.customAttributes);
    }
    if (body.sale !== undefined) {
      existingProduct.sale = parseNumberField(body.sale, "sale", existingProduct.sale);
    }
    if (body.averagerate !== undefined) {
      existingProduct.averagerate = parseNumberField(body.averagerate, "averagerate", existingProduct.averagerate);
    }
    if (body.ratecount !== undefined) {
      existingProduct.ratecount = parseNumberField(body.ratecount, "ratecount", existingProduct.ratecount);
    }
    if (body.quantity !== undefined) {
      existingProduct.quantity = parseNumberField(body.quantity, "quantity", existingProduct.quantity);
    }

    for (const [key, value] of Object.entries(uploadedImages)) {
      existingProduct[key] = value;
    }

    await existingProduct.save();
    req.io.emit("productsChanged");


    res.status(200).json({ success: true, product: existingProduct });
  } catch (err) {
    console.error(err);
    if (err.message.includes("Invalid JSON") || err.message.includes("Invalid number")) {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

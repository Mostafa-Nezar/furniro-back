const User = require("../models/user");
const Order = require("../models/order");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Product = require("../models/product");
const NotificationService = require("../utils/notificationService");

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
    const parseJSON = (str, defaultValue = {}) => {
  try {
    return str && str.trim() !== "" ? JSON.parse(str) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const newProduct = new Product({
  id: body.id,
  _id: body.id,
  key: body.key,
  name: body.name,
  price: body.price,
  des: body.des,
  general: parseJSON(body.general, {
    salespackage: "",
    model: "",
    secoundary: "",
    configuration: "",
    upholsterymaterial: "",
    upholsterycolor: "",
  }),
  myproduct: parseJSON(body.myproduct, {
    filingmaterial: "",
    finishtype: "",
    adjustheaderest: "",
    maxmumloadcapcity: "",
    originalofmanufacture: "",
  }),
  dimensions: parseJSON(body.dimensions, {
    width: "",
    height: "",
    depth: "",
    weight: "",
    seatheight: "",
    legheight: "",
  }),
  warranty: parseJSON(body.warranty, {
    summry: "",
    servicetype: "",
    dominstic: "",
    covered: "",
    notcovered: "",
  }),
  sale: body.sale || 0,
  averagerate: body.averagerate || 0,
  ratecount: body.ratecount || 0,
  quantity: body.quantity || 0,
  ...uploadedImages
});


    await newProduct.save();
    const users = await User.find({}, "id"); 
    for (const user of users) {
      await NotificationService.notifyProductBackInStock(user.id, newProduct.name);
    }
    res.status(201).json({ success: true, product: newProduct });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

exports.registerAdmin = async (req, res) => {
  try {
    const { id, name, email, password, isGoogleUser, image, isSubscribed, facebookId, phoneNumber, location } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new User({
      id,
      name,
      email,
      password: hashedPassword,
      isGoogleUser: isGoogleUser || false,
      image: image || null,
      isSubscribed: isSubscribed || false,
      facebookId: facebookId || null,
      phoneNumber: phoneNumber || null,
      location: location || "",
      Admin: true, // ✨ أهم حاجة
    });

    await newAdmin.save();
    res.status(201).json({ message: "Admin registered successfully", admin: newAdmin });
  } catch (error) {
    res.status(500).json({ message: "Error registering admin", error: error.message });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email, Admin: true });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, Admin: admin.Admin },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Admin logged in successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in admin", error: error.message });
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

    const allowedStatuses = [ "refused", "shipping", "delivered"];
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

    const parseJSON = (str, defaultValue = {}) => {
      try {
        return str && str.trim() !== "" ? JSON.parse(str) : defaultValue;
      } catch {
        return defaultValue;
      }
    };
    let existingProduct = null;
      if (!isNaN(productId)) {
        existingProduct = await Product.findOne({
          $or: [{ _id: Number(productId) }, { id: Number(productId) }],
        });
      } else {
        existingProduct = await Product.findOne({
          $or: [{ _id: productId }, { id: Number(productId) || productId }],
        });
      }
      if (!existingProduct) {
        return res.status(404).json({ success: false, message: "not exist" });
      }
    existingProduct.name = body.name ?? existingProduct.name;
    existingProduct.price = body.price ?? existingProduct.price;
    existingProduct.des = body.des ?? existingProduct.des;
    existingProduct.general = parseJSON(body.general, existingProduct.general);
    existingProduct.myproduct = parseJSON(body.myproduct, existingProduct.myproduct);
    existingProduct.dimensions = parseJSON(body.dimensions, existingProduct.dimensions);
    existingProduct.warranty = parseJSON(body.warranty, existingProduct.warranty);
    existingProduct.sale = body.sale ?? existingProduct.sale;
    existingProduct.averagerate = body.averagerate ?? existingProduct.averagerate;
    existingProduct.ratecount = body.ratecount ?? existingProduct.ratecount;
    existingProduct.quantity = body.quantity ?? existingProduct.quantity;

    for (const [key, value] of Object.entries(uploadedImages)) {
      existingProduct[key] = value;
    }

    await existingProduct.save();

    res.status(200).json({ success: true, product: existingProduct });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

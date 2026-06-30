const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/user");
const Product = require("../models/product");
const LoginLog = require("../models/loginhistory");
const { sendWelcomeEmail } = require("../utils/emailService");
const NotificationService = require("../utils/notificationService");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;
const Cart = require("../models/cart");
const getLocationFromIP = async (ip) => {
  try {
    const res = await axios.get(`https://ipapi.co/${ip}/json/`);

    const {
      country_name,
      city,
      region,
      latitude,
      longitude,
    } = res.data;

    const locationString = [city, region, country_name]
      .filter(Boolean)
      .join(", ");

    return {
      country: country_name,
      city,
      region,
      latitude,
      longitude,
      locationString,
    };
  } catch (err) {
    return null;
  }
};

exports.signup = async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;

  try {
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const hashedPass = await bcrypt.hash(password, 10);
    const lastUser = await User.findOne().sort({ id: -1 });
    const nextId = lastUser ? lastUser.id + 1 : 1;

    const newUser = new User({
      id: nextId,
      name,
      email,
      password: hashedPass,
      isSubscribed: false,
      phoneNumber: phoneNumber || null,
      location: ""
    });

    await newUser.save();

    // Send welcome notification (non-blocking)
    try {
      await NotificationService.notifyWelcome(newUser.id, newUser.name);
    } catch (notificationError) {
      console.error("❌ Welcome notification error:", notificationError);
    }

    const token = jwt.sign({ user: { id: newUser.id } }, JWT_SECRET, { expiresIn: "7d" });
    const userObj = newUser.toObject();
    delete userObj.password;

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      msg: "User registered successfully",
      token,
      user: userObj
    });
  } catch (err) {
    console.error("❌ Signup error:", err);

    // Handle MongoDB duplicate key error
    if (err.code === 11000 || err.keyPattern?.email) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || req.ip;
    const user = await User.findOne({ email }).populate("cart");
    const location = await getLocationFromIP(ip);

    if (!user || user.isGoogleUser || !user.password) {
      return res.status(401).json({ msg: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid email or password" });
    }

    await LoginLog.create({
      userId: user.id,
      email: user.email,
      ip: ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      google: false,
      location: location || {
        country: null,
        city: null,
        region: null,
        latitude: null,
        longitude: null,
        locationString: null,
      },
    });
    const token = jwt.sign({ user: { id: user.id } }, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      msg: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        cart: user.cart ? user.cart.items : [],
        isSubscribed: user.isSubscribed || false,
        isGoogleUser: user.isGoogleUser || false,
        phoneNumber: user.phoneNumber || null,
        location: user.location || ""
      },
    });

  } catch (err) {
    console.error("❌ Signin error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.googleSignIn = async (req, res) => {
  const { token } = req.body;

  try {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || req.ip;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email }).populate("cart");
    const location = await getLocationFromIP(ip);

    if (!user) {
      const lastUser = await User.findOne().sort({ id: -1 });
      const nextId = lastUser ? lastUser.id + 1 : 1;

      user = new User({
        id: nextId,
        name,
        email,
        isGoogleUser: true,
        image: picture,
        isSubscribed: false,
      });

      await user.save();

      // try {
      //   await sendWelcomeEmail(user.email, user.name);
      // } catch (emailError) {
      //   console.error("❌ Welcome email error:", emailError);
      // }

      try {
        await NotificationService.notifyWelcome(user.id, user.name);
      } catch (notificationError) {
        console.error("❌ Welcome notification error:", notificationError);
      }
    }
    await LoginLog.create({
      userId: user.id,
      email: user.email,
      ip: ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      google: true,
      location: location || {
        country: null,
        city: null,
        region: null,
        latitude: null,
        longitude: null,
        locationString: null,
      },
    });

    const jwtToken = jwt.sign({ user: { id: user.id } }, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      msg: "Google login successful",
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        cart: user.cart ? user.cart.items : [],
        isSubscribed: user.isSubscribed || false,
      },
    });
  } catch (err) {
    console.error("❌ Google signin error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.updateUserImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No image file uploaded" });

    const userId = Number(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ msg: "Invalid user ID" });
    const user = await User.findOneAndUpdate(
      { id: userId },
      { image: req.file.path },
      { new: true, select: "-password" }
    );
    if (!user) return res.status(404).json({ msg: "User not found" });

    await NotificationService.createNotification(userId, "Your profile image has been updated successfully.");

    req.app.get("io")?.to(String(userId)).emit("avatarUpdated", {
      userId, imageUrl: user.image, updatedAt: Date.now(),
    });

    res.json({ msg: "User image updated successfully", imageUrl: user.image, user });

  } catch (err) {
    console.error("❌ Update user image error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { location } = req.body;
    const userId = Number(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ msg: "Invalid user ID" });
    const user = await User.findOneAndUpdate(
      { id: userId },
      { location },
      { new: true, select: "-password" }
    );

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    await NotificationService.createNotification(userId, `Your location has been updated to: ${location}`);
    res.json({ msg: "Location updated successfully", location: user.location });
  } catch (err) {
    console.error("❌ Update location error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.updatePhoneNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const userId = Number(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ msg: "Invalid user ID" });
    const user = await User.findOneAndUpdate(
      { id: userId },
      { phoneNumber },
      { new: true, select: "-password" }
    );

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    await NotificationService.createNotification(userId, `Your phone number has been updated to: ${phoneNumber}`);
    res.json({ msg: "Phone number updated successfully", phoneNumber: user.phoneNumber });
  } catch (err) {
    console.error("❌ Update phone number error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.updateUserCart = async (req, res) => {
  try {
    const { cart } = req.body;
    if (!cart) return res.status(400).json({ msg: "Cart is required" });

    const userId = Number(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ msg: "Invalid user ID" });
    const ids = cart.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: ids } });
    const productMap = {};
    const user = await User.findOne({ id: userId });
    if (!user) return res.status(404).json({ msg: "User not found" });

    products.forEach((p) => { productMap[p._id.toString()] = p });

    for (let item of cart) {
      const product = productMap[item.productId];
      if (!product) return res.status(400).json({ msg: "Proudct Is Not Exist" });
      if (product.quantity <= 0) return res.status(400).json({ msg: "Out of stock" });
      if (item.quantity > product.quantity) return res.status(400).json({ msg: `Only ${product.quantity} in stock` });
      if (item.quantity > 10) return res.status(400).json({ msg: "You can only 10 items" });
    }

    const [agg] = await Cart.aggregate([
      { $match: { user_id: user._id } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$_id",
          totalItems: { $sum: "$items.quantity" },
          totalPrice: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
        }
      }
    ]);

    const updatedCart = await Cart.findOneAndUpdate(
      { user_id: user._id },
      {
        $set: {
          items: cart.map(i => ({...i, price: productMap[i.productId].price})),
          userRef: user._id,
          user_id: user._id,
          userid: user.id,
          totalItems: agg.totalItems || 0,
          totalPrice: agg.totalPrice || 0
        }
      },
      { new: true, upsert: true }
    );

    if (!user.cart || user.cart.toString() !== updatedCart._id.toString()) {
      user.cart = updatedCart._id;
      await user.save();
    }

    return res.json({ msg: "Cart updated successfully", cart: updatedCart.items });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.editUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ msg: "Invalid user ID" });

    const updateData = req.body;

    const disallowedFields = ['id', 'password', 'isGoogleUser', 'cart'];
    disallowedFields.forEach(field => {
      delete updateData[field];
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ msg: "No valid fields to update" });
    }

    if (updateData.email) {
      const existingUser = await User.findOne({ email: updateData.email });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ msg: "Email already exists" });
      }
    }

    const user = await User.findOneAndUpdate(
      { id: userId },
      { $set: updateData },
      { new: true, select: "-password" }
    );

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const updatedFields = Object.keys(updateData).join(", ");
    try {
      await NotificationService.createNotification(
        userId,
        `Your profile has been updated: ${updatedFields}`
      );
    } catch (notificationError) {
      console.error("❌ Notification error:", notificationError);
    }

    res.json({
      msg: "User updated successfully",
      user
    });

  } catch (err) {
    console.error("❌ Edit user error:", err);

    // Handle MongoDB duplicate key error
    if (err.code === 11000 || err.keyPattern?.email) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.checkToken = async (req, res) => {
  const token = req.cookies?.token || (req.headers.authorization && req.headers.authorization.split(" ")[1]);
  if (!token) return res.status(401).json({ msg: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.user.id;
    const user = await User.findOne({ id: userId }).populate("cart").select("-password");

    res.json({
      msg: "Token is valid",
      userId: decoded.user.id,
      user
    });
  } catch (err) {
    res.status(401).json({ msg: "Token invalid or expired" });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none"
  });
  res.json({ msg: "Logged out successfully" });
};

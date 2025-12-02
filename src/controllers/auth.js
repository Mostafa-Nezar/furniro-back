const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/user");
const { sendWelcomeEmail } = require("../utils/emailService");
const NotificationService = require("../utils/notificationService");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;

exports.signup = async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ msg: "All fields are required" });

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "Email already exists" });

    const hashedPass = await bcrypt.hash(password, 10);
    const lastUser = await User.findOne().sort({ id: -1 });
    const nextId = lastUser ? lastUser.id + 1 : 1;

    const newUser = new User({
      id: nextId,
      name,
      email,
      password: hashedPass,
      isSubscribed: false,
      phoneNumber,
      location: ""
    });

    await newUser.save();

    // try {
    //   await sendWelcomeEmail(newUser.email, newUser.name);
    // } catch (emailError) {
    //   console.error("❌ Welcome email error:", emailError);
    // }

    try {
      await NotificationService.notifyWelcome(newUser.id, newUser.name);
    } catch (notificationError) {
      console.error("❌ Welcome notification error:", notificationError);
    }

    const token = jwt.sign({ user: { id: newUser.id } }, JWT_SECRET, { expiresIn: "7d" });
    const userObj = newUser.toObject();
    delete userObj.password;
    res.status(201).json({
      msg: "User registered successfully",
      token,
      user: userObj
    });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.signin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ msg: "Email and password are required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid password" });

    const token = jwt.sign({ user: { id: user.id } }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      msg: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        cart: user.cart || [],
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
  if (!token) return res.status(400).json({ msg: "Missing Google token" });

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });

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

    const jwtToken = jwt.sign({ user: { id: user.id } }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      msg: "Google login successful",
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        cart: user.cart || [],
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
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
      return res.status(401).json({ msg: "No token provided" });

    let decoded;
    try {
      decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    } catch {
      return res.status(401).json({ msg: "Invalid or expired token" });
    }

    const userId = Number(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ msg: "Invalid user ID" });
    if (decoded.user.id !== userId)
      return res.status(403).json({ msg: "Unauthorized: user ID mismatch" });

    if (!req.file) return res.status(400).json({ msg: "No image file uploaded" });

    const user = await User.findOneAndUpdate(
      { id: userId },
      { image: req.file.path },
      { new: true, select: "-password" }
    );
    if (!user) return res.status(404).json({ msg: "User not found" });

    await NotificationService.createNotification(
      userId,
      "Your profile image has been updated successfully."
    );

    req.app.get("io")?.to(String(userId)).emit("avatarUpdated", {
      userId,
      imageUrl: user.image,
      updatedAt: Date.now(),
    });

    res.json({ msg: "User image updated successfully", imageUrl: user.image, user });

  } catch (err) {
    console.error("❌ Update user image error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ msg: "Invalid user ID" });
    }

    const { location } = req.body;
    if (!location) {
      return res.status(400).json({ msg: "Location is required" });
    }

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
    const userId = Number(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ msg: "Invalid user ID" });
    }

    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ msg: "Phone number is required" });
    }

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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ msg: " server No token provided" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ msg: " server Invalid or expired token" });
    }

    const userId = Number(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ msg: " server Invalid user ID" });

    if (decoded.user.id !== userId) {
      return res.status(403).json({ msg: " server Unauthorized: user ID mismatch" });
    }

    const { cart } = req.body;
    if (!cart) {
      return res.status(400).json({ msg: " server Cart is required" });
    }

    for (let item of cart) {
      const product = await Product.findOne({ id: item.id });
      if (!product) continue;

      if (product.quantity <= 0) {
        return res.status(400).json({ msg: " server Out of stock" });
      }

      if (item.quantity > product.quantity) {
        return res
          .status(400)
          .json({ msg: `Only ${product.quantity} in stock` });
      }

      if (item.quantity > 10) {
        return res
          .status(400)
          .json({ msg: " server You can only 10 items" });
      }
    }

    const user = await User.findOneAndUpdate(
      { id: userId },
      { $set: { cart } },
      { new: true, select: "-password" }
    );

    if (!user) return res.status(404).json({ msg: " server User not found" });

    return res.json({ msg: " server Cart updated successfully", cart: user.cart });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: " server Server error", error: err.message });
  }
};

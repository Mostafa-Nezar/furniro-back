const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/user");
const { sendWelcomeEmail } = require("../utils/emailService");
const NotificationService = require("../utils/notificationService");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;

exports.signup = async (req, res) => {
  const { name, email, password } = req.body;
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
       location: ""
    });

    await newUser.save();

    try {
      await sendWelcomeEmail(newUser.email, newUser.name);
    } catch (emailError) {
      console.error("❌ Welcome email error:", emailError);
    }

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

      try {
        await sendWelcomeEmail(user.email, user.name);
      } catch (emailError) {
        console.error("❌ Welcome email error:", emailError);
      }

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

exports.getUser = async (req, res) => {
  try {
    const userId = Number(req.params.id); 
    if (isNaN(userId)) return res.status(400).json({ msg: "Invalid user ID" });

    const user = await User.findOne({ id: userId })
      .select("-password")
      .lean(); 

    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      cart: user.cart || [],
      isSubscribed: !!user.isSubscribed,
    });
  } catch (err) {
    console.error("❌ Get user error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ msg: "Invalid user ID" });

    const { cart } = req.body;
    const user = await User.findOneAndUpdate(
      { id: userId },
      cart ? { cart } : {},
      { new: true, select: "-password" }
    );

    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json({ msg: "Cart updated successfully", cart: user.cart });
  } catch (err) {
    console.error("❌ Update user error:", err);
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

exports.signupx = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ msg: "All fields are required" });

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "Email already exists" });

    const hashedPass = await bcrypt.hash(password, 6);
    const lastUser = await User.findOne().sort({ id: -1 });
    const nextId = lastUser ? lastUser.id + 1 : 1;
    const newUser = new User({
      id: nextId,
      name,
      email,
      password: hashedPass,
      isSubscribed: false,
      location: ""
    });

    await newUser.save();

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
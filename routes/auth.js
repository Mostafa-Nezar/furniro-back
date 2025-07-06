const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/user");
const { sendWelcomeEmail } = require("../utils/emailService");

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;

// ✅ Register
router.post("/signup", async (req, res) => {
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
      isSubscribed:false
    });

    await newUser.save();

    // Send welcome email
    await sendWelcomeEmail(newUser.email, newUser.name);

    const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      msg: "User registered successfully",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        cart: newUser.cart || [],
        isSubscribed:newUser.isSubscribed || false
      },
    });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Login
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ msg: "Email and password are required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid password" });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      msg: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image:user.image,
        cart: user.cart || [],
        isSubscribed: user.isSubscribed || false,
      },
    });
  } catch (err) {
    console.error("❌ Signin error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Google Sign-In
router.post("/google", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ msg: "Missing Google token" });

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { name, email } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      const lastUser = await User.findOne().sort({ id: -1 });
      const nextId = lastUser ? lastUser.id + 1 : 1;

      user = new User({ id: nextId, name, email, isGoogleUser: true });
      await user.save();
    }

    const jwtToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      msg: "Google login successful",
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        cart: user.cart || [],
      },
    });
  } catch (err) {
    console.error("❌ Google Sign-In Error:", err);
    res.status(401).json({ msg: "Google authentication failed" });
  }
});

module.exports = router;

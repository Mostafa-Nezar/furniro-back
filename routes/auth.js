// const express = require("express");
// const bcrypt = require("bcryptjs");
// const router = express.Router();
// const User = require("../models/user");

// // ✅ Sign Up
// router.post("/signup", async (req, res) => {
//   console.log("📥 Signup request:", req.body);
//   const { name, email, password } = req.body;

//   try {
//     const exists = await User.findOne({ email });
//     if (exists) return res.status(400).json({ msg: "Email already exists" });

//     const hashedPass = await bcrypt.hash(password, 10);
//     const newUser = await User.create({ name, email, password: hashedPass });

//     res.status(201).json({ msg: "User registered successfully", user: { name: newUser.name, email: newUser.email } });
//   } catch (err) {
//     res.status(500).json({ msg: "Server error", error: err.message });
//   }
// });

// // ✅ Sign In
// router.post("/signin", async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ msg: "User not found" });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ msg: "Invalid password" });

//     res.json({ msg: "Login successful", user: { name: user.name, email: user.email } });
//   } catch (err) {
//     res.status(500).json({ msg: "Server error", error: err.message });
//   }
// });

// module.exports = router;
const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");

const router = express.Router();
const USERS_FILE = path.join(__dirname, "../data/users.json");
const client = new OAuth2Client("866938789864-hfj30l2ktsbdb4t78r3cl1lj3p4vehmh.apps.googleusercontent.com");

// 🧠 Helper Functions
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  const data = fs.readFileSync(USERS_FILE, "utf8");
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ✅ Manual Sign Up
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ msg: "All fields are required" });

  const users = readUsers();
  const exists = users.find((u) => u.email === email);
  if (exists) return res.status(400).json({ msg: "Email already exists" });

  const hashedPass = await bcrypt.hash(password, 10);
  const newUser = { name, email, password: hashedPass };

  users.push(newUser);
  writeUsers(users);

  res.status(201).json({
    msg: "User registered successfully",
    user: { name: newUser.name, email: newUser.email },
  });
});

// ✅ Manual Sign In
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ msg: "Email and password are required" });

  const users = readUsers();
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(404).json({ msg: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ msg: "Invalid password" });

  res.json({ msg: "Login successful", user: { name: user.name, email: user.email } });
});

// ✅ Google Sign-In
router.post("/google", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ msg: "Missing Google token" });

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: "866938789864-hfj30l2ktsbdb4t78r3cl1lj3p4vehmh.apps.googleusercontent.com",
    });

    const payload = ticket.getPayload();
    const { name, email } = payload;

    const users = readUsers();
    let user = users.find((u) => u.email === email);

    if (!user) {
      user = { name, email, password: "", isGoogleUser: true };
      users.push(user);
      writeUsers(users);
    }

    res.json({ msg: "Google login successful", user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error("❌ Google Sign-In Error:", err);
    res.status(401).json({ msg: "Google authentication failed" });
  }
});

// ✅ Export Router at the END
module.exports = router;

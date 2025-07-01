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

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ msg: "All fields are required" });

  const users = readUsers();
  const exists = users.find((u) => u.email === email);
  if (exists) return res.status(400).json({ msg: "Email already exists" });

  const hashedPass = await bcrypt.hash(password, 10);

  // ======== ✅ إضافة ID تلقائي ==========
  let newId = 1;
  if (users.length > 0) {
    const maxId = Math.max(...users.map(u => u.id || 0));
    newId = maxId + 1;
  }
  // ======================================

  const newUser = {
    id: newId, // ✅ إضافة الـ id هنا
    name,
    email,
    password: hashedPass,
    cart: [], // ✅ تهيئة سلة تسوق فارغة
  };

  users.push(newUser);
  writeUsers(users);

  res.status(201).json({
    msg: "User registered successfully",
    user: { id: newUser.id, name: newUser.name, email: newUser.email },
  });
});


router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ msg: "Email and password are required" });

  const users = readUsers();
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(404).json({ msg: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ msg: "Invalid password" });

  res.json({ msg: "Login successful", user: { id: user.id, name: user.name, email: user.email, cart: user.cart || [] } });
});

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

    res.json({ msg: "Google login successful", user: { name: user.name, email: user.email, cart: user.cart || [] } });
  } catch (err) {
    console.error("❌ Google Sign-In Error:", err);
    res.status(401).json({ msg: "Google authentication failed" });
  }
});

module.exports = router;

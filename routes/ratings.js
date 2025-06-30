const express = require("express");
const fs = require("fs");
const router = express.Router();

const RATINGS_FILE = "ratings.json";

// ✅ Get all ratings
router.get("/", (req, res) => {
  fs.readFile(RATINGS_FILE, "utf-8", (err, data) => {
    if (err) return res.status(500).json({ msg: "Error reading ratings file" });
    res.json(JSON.parse(data || "[]"));
  });
});

// ✅ Add new rating
router.post("/", (req, res) => {
  const { userid, productid, rate } = req.body;

  if (!userid || !productid || typeof rate !== "number") {
    return res.status(400).json({ msg: "Invalid data sent" });
  }

  const newRating = {
    _id: `r${Date.now()}`,
    userid,
    productid,
    rate,
    createdAt: new Date().toISOString()
  };

  fs.readFile(RATINGS_FILE, "utf-8", (err, data) => {
    const ratings = !err && data ? JSON.parse(data) : [];
    ratings.push(newRating);

    fs.writeFile(RATINGS_FILE, JSON.stringify(ratings, null, 2), (err) => {
      if (err) return res.status(500).json({ msg: "Failed to save rating" });
      res.status(201).json({ msg: "Rating saved successfully", rating: newRating });
    });
  });
});

module.exports = router;

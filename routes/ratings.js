const express = require("express");
const router = express.Router();
const Rating = require("../models/rating");

// ✅ Get all ratings
router.get("/", async (req, res) => {
  try {
    const ratings = await Rating.find();
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching ratings" });
  }
});

// ✅ Add new rating
router.post("/", async (req, res) => {
  const { userid, productid, rate } = req.body;

  if (!userid || !productid || typeof rate !== "number") {
    return res.status(400).json({ msg: "Invalid data sent" });
  }

  try {
    const newRating = new Rating({ userid, productid, rate });
    const saved = await newRating.save();
    res.status(201).json({ msg: "Rating saved successfully", rating: saved });
  } catch (err) {
    res.status(500).json({ msg: "Failed to save rating" });
  }
});

module.exports = router;

const Rating = require("../models/rating");

exports.getAllRatings = async (req, res) => {
  try {
    const ratings = await Rating.find().lean();
    res.json(ratings);
  } catch (err) {
    console.error("❌ Error fetching ratings:", err);
    res.status(500).json({ msg: "Error fetching ratings" });
  }
};

exports.addRating = async (req, res) => {
  try {
    const { userid, productid, rate } = req.body;

    if (!userid || !productid || typeof rate !== "number") {
      return res.status(400).json({ msg: "Invalid data sent" });
    }

    const saved = await Rating.findOneAndUpdate(
      { userid, productid }, 
      { rate },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ msg: "Rating saved successfully", rating: saved });
  } catch (err) {
    console.error("❌ Failed to save rating:", err);
    res.status(500).json({ msg: "Failed to save rating" });
  }
};

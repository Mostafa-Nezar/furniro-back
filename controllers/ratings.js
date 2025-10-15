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
    const {  userid, productid, rateid, rate } = req.body;

    if (!userid || !productid || typeof rate !== "number") {
      return res.status(400).json({ msg: "Invalid data sent" });
    }
    let existingRating = await Rating.findOne({ rateid });
        if (existingRating) {
      existingRating.rate = rate;
      await existingRating.save();
      return res.status(200).json({ msg: "Rating updated successfully", rating: existingRating });
    } else {
      const newRating = new Rating({ rateid, userid, productid, rate });
      await newRating.save();
      return res.status(201).json({ msg: "Rating created successfully", rating: newRating });
    }

  } catch (err) {
    console.error("❌ Failed to save rating:", err);
    res.status(500).json({ msg: "Failed to save rating" });
  }
};

const User = require("../models/user");

exports.getTopRatedUsers = async (req, res) => {
  try {
    const ratings = await Rating.find({ rate: { $in: [4, 5] } }).lean();

    const userIds = [...new Set(ratings.map(r => r.userid))];
    const users = await User.find({ id: { $in: userIds } }).lean();
    res.json(users);
  } catch (err) {
    console.error("❌ Error fetching top rated users:", err);
    res.status(500).json({ msg: "Error fetching top rated users" });
  }
};

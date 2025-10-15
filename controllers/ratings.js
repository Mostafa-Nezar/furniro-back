const Rating = require("../models/rating");
const User = require("../models/user");

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
    const {  userid, productid, rateid, rate, comment } = req.body;

    if (!userid || !productid || typeof rate !== "number") {
      return res.status(400).json({ msg: "Invalid data sent" });
    }
    let existingRating = await Rating.findOne({ rateid });

    if (!existingRating && comment && (!rate || rate === 0)) {
      return res.status(400).json({ msg: "You must rate before commenting" });
    }
    if (existingRating) {
      existingRating.rate = rate;
    if (comment) existingRating.comment = comment; 
      await existingRating.save();
      return res.status(200).json({ msg: "Rating updated successfully", rating: existingRating });
    } else {
      const newRating = new Rating({ rateid, userid, productid, rate, comment });
      await newRating.save();
      return res.status(201).json({ msg: "Rating created successfully", rating: newRating });
    }

  } catch (err) {
    console.error("❌ Failed to save rating:", err);
    res.status(500).json({ msg: "Failed to save rating" });
  }
};

exports.getTopRatingsWithUsers = async (req, res) => {
  try {
    const productId = Number(req.params.productId); 

    const ratings = await Rating.find({
      productid: productId,
      rate: { $in: [4, 5] }
    }).lean();

    const userIds = [...new Set(ratings.map(r => r.userid))];
    const users = await User.find({ id: { $in: userIds } }).lean();

    const result = ratings.map(r => {
      const user = users.find(u => u.id === r.userid);
      return {
        rate: r.rate,
        comment: r.comment || null, 
        createdAt: r.createdAt,
        user: {
          name: user?.name || "Unknown",
          image: user?.image || null
        }
      };
    });

    res.json(result);

  } catch (err) {
    console.error("❌ Error fetching top ratings with users:", err);
    res.status(500).json({ msg: "Error fetching top ratings with users" });
  }
};

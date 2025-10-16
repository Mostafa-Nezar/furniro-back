const express = require("express");
const router = express.Router();
const { getAllRatings, addRating, getTopRatingsWithUsers } = require("../controllers/ratings");

router.get("/", getAllRatings);
router.post("/", addRating);
router.get("/top-ratings/:productId", getTopRatingsWithUsers); 
module.exports = router;

const express = require("express");
const router = express.Router();
const { getAllRatings, addRatingx, getTopRatingsWithUsers } = require("../controllers/ratings");

router.get("/", getAllRatings);
router.post("/", addRatingx);
router.get("/top-ratings/:productId", getTopRatingsWithUsers); 
module.exports = router;

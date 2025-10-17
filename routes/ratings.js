const express = require("express");
const router = express.Router();
const { getAllRatings, addRating, addRatingtest, getTopRatingsWithUsers } = require("../controllers/ratings");

router.get("/", getAllRatings);
router.post("/", addRating);
router.post("/test", addRatingtest);
router.get("/top-ratings/:productId", getTopRatingsWithUsers); 
module.exports = router;

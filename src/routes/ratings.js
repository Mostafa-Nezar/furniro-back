const express = require("express");
const router = express.Router();
const { getAllRatings, addRating, addRatingtest, getTopRatingsWithUsers } = require("../controllers/ratings");
const { addRatingSchema } = require("../validators/rating");
const validate = require("../middleware/validate");

router.get("/", getAllRatings);
router.post("/", validate(addRatingSchema), addRating);
router.post("/test", validate(addRatingSchema), addRatingtest);
router.get("/top-ratings/:productId", getTopRatingsWithUsers);
module.exports = router;

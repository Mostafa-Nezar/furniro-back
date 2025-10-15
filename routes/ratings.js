const express = require("express");
const router = express.Router();
const { getAllRatings, addRating, getTopRatings } = require("../controllers/ratings");

router.get("/", getAllRatings);
router.post("/", addRating);
router.get("/top", getTopRatings);
module.exports = router;

const express = require("express");
const router = express.Router();
const { getAllRatings, addRating } = require("../controllers/ratings");

router.get("/", getAllRatings);
router.post("/", addRating);

module.exports = router;

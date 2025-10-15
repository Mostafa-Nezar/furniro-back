const express = require("express");
const router = express.Router();
const { getAllRatings, addRating, getTopRatedUsers } = require("../controllers/ratings");

router.get("/", getAllRatings);
router.post("/", addRating);
router.get("/top-users", getTopRatedUsers); 
module.exports = router;

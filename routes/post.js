const express = require("express");
const { getAllPosts, addPost } = require("../controllers/post");

const router = express.Router();

router.get("/", getAllPosts);
router.post("/", addPost);

module.exports = router;

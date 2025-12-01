const express = require("express");
const { getAllPosts, addPost } = require("../controllers/post");
const validate = require("../middleware/validate");
const { addPostSchema } = require("../validators/post");

const router = express.Router();

router.get("/", getAllPosts);
router.post("/", validate(addPostSchema), addPost);

module.exports = router;

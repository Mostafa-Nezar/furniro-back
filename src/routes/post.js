const express = require("express");
const { getAllPosts, addPost } = require("../controllers/post");
const validate = require("../middleware/validate");
const { addPostSchema } = require("../validators/post");
const multer = require("multer");
const { storage } = require("../config/cloudinary");
const router = express.Router();

const upload = multer({ storage });

router.get("/", getAllPosts);
router.post("/", upload.single("image"), validate(addPostSchema), addPost);

module.exports = router;

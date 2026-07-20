const express = require("express");
const path = require("path");
const { getAllPosts, addPost } = require("../controllers/post");
const validate = require("../middleware/validate");
const { addPostSchema } = require("../validators/post");
const multer = require("multer");
const router = express.Router();

const storage = multer.diskStorage({
    destination: "uploads/posts",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

router.get("/", getAllPosts);
router.post("/", upload.single("image"), validate(addPostSchema), addPost);

module.exports = router;

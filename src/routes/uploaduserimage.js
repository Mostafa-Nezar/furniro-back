const express = require("express");
const multer = require("multer");
const { storage } = require("../config/cloudinary");
const { uploadAvatar, updateUserImage } = require("../controllers/uploaduserimage");

const router = express.Router();
const upload = multer({ storage });

router.post("/upload-avatar", upload.single("avatar"), uploadAvatar);
router.patch("/:id/update-image", upload.single("avatar"), updateUserImage);

module.exports = router;

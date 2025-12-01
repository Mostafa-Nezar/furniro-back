const express = require("express");
const multer = require("multer");
const { storage } = require("../config/cloudinary");
const upload = multer({ storage });
const router = express.Router();
const authController = require("../controllers/auth");
const { signupSchema } = require("../validators/user");
const validate = require("../middleware/validate");
router.post("/signup", validate(signupSchema), authController.signup);
router.post("/signin", authController.signin);
router.post("/google", authController.googleSignIn);
router.patch("/cart/:id/", authController.updateUserCart);
router.patch("/:id/update-image", upload.single("avatar"), authController.updateUserImage);
router.patch("/users/:id/location", authController.updateLocation);
router.patch("/users/:id/phone", authController.updatePhoneNumber);

module.exports = router;

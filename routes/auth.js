const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const { signupSchema } = require("../validators/user");
const validate = require("../middleware/validate");
router.post("/signup", validate(signupSchema), authController.signup);
router.post("/signin", authController.signin);
router.post("/google", authController.googleSignIn);
router.get("/user/:id", authController.getUser);
router.patch("/user/:id", authController.updateUser);
router.patch("/users/:id/location", authController.updateLocation);
router.patch("/users/:id/phone", authController.updatePhoneNumber);

module.exports = router;

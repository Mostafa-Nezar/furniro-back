const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");

router.post("/signup", authController.signup);
router.post("/signin", authController.signin);
router.post("/google", authController.googleSignIn);
router.get("/user/:id", authController.getUser);
router.patch("/user/:id", authController.updateUser);

module.exports = router;

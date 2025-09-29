const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const multer = require("multer");
const { storage } = require("../config/cloudinary");
const upload = multer({ storage });
router.get("/users", adminController.getUsers);
router.get("/orders", adminController.getOrders);
router.delete("/users/:id", adminController.deleteUser);
router.post(
  "/add-product",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  adminController.addProduct
);
router.post("/admin", adminController.registerAdmin);
router.post("/admin/login", adminController.loginAdmin);

module.exports = router;

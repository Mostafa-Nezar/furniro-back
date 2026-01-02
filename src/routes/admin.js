const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const multer = require("multer");
const { storage } = require("../config/cloudinary");
const upload = multer({ storage });
const adminAuth = require("../middleware/adminAuth");

// Public routes (no auth required)
router.post("/adminregister", adminController.registerAdmin);
router.post("/adminlogin", adminController.loginAdmin);

// Protected routes (require admin auth)
router.get("/users", adminAuth, adminController.getUsers);
router.get("/orders", adminAuth, adminController.getOrders);
router.patch("/orders/:id/status", adminAuth, adminController.updateOrderStatus);
router.delete("/users/:id", adminAuth, adminController.deleteUser);
router.delete("/products/:id/delete", adminAuth, adminController.deleteProduct);
router.delete("/orders/:id", adminAuth, adminController.deleteOrder);
router.post(
  "/add-product",
  adminAuth,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  adminController.addProduct
);
router.put(
  "/update-product/:id",
  adminAuth,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  adminController.adminUpdateProduct
);


module.exports = router;

const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const multer = require("multer");
const { storage } = require("../config/cloudinary");
const upload = multer({ storage });
const adminAuth = require("../middleware/adminAuth");
const validate = require("../middleware/validate");
const { productValidationSchema } = require("../validators/product");

router.post("/adminregister", adminController.registerAdmin);
router.post("/adminlogin", adminController.loginAdmin);
router.post("/adminlogout", adminController.logoutAdmin);

router.get("/users", adminAuth, adminController.getUsers);
router.get("/orders", adminAuth, adminController.getOrders);
router.patch("/orders/:id/status", adminAuth, adminController.updateOrderStatus);
router.delete("/users/:id", adminAuth, adminController.deleteUser);
router.delete("/products/:id/delete", adminAuth, adminController.deleteProduct);
router.delete("/orders/:id", adminAuth, adminController.deleteOrder);
router.post("/add-product", adminAuth, validate(productValidationSchema), upload.array("images", 6), adminController.addProduct);
router.put("/update-product/:id", adminAuth, validate(productValidationSchema), upload.array("images", 6), adminController.adminUpdateProduct);
router.get("/categories", adminAuth, adminController.getCategories);
router.post("/add-category", adminAuth, adminController.addCategory);

module.exports = router;

const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const auth = require("../middleware/auth");

const adminAuth = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ msg: "Admin access denied" });
  }
  next();
};

router.get("/dashboard", auth, adminAuth, adminController.getDashboard);

router.get("/users", auth, adminAuth, adminController.getUsers);
router.put("/users/:id", auth, adminAuth, adminController.updateUserStatus);
router.delete("/users/:id", auth, adminAuth, adminController.deleteUser);

router.get("/products", auth, adminAuth, adminController.getProducts);
router.post("/products", auth, adminAuth, adminController.addOrUpdateProduct);
router.put("/products/:id", auth, adminAuth, adminController.updateProduct);
router.delete("/products/:id", auth, adminAuth, adminController.deleteProduct);

router.get("/orders", auth, adminAuth, adminController.getOrders);

module.exports = router;

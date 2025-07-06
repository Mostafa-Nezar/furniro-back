const router = require("express").Router();
const User = require("../models/user");
const Product = require("../models/product");
const Order = require("../models/order");
const Rating = require("../models/rating");
const Notification = require("../models/notification");
const auth = require("../middleware/auth");

// Middleware to check if user is admin
const adminAuth = (req, res, next) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ msg: "Admin access denied" });
    }
    next();
};

// Dashboard statistics
router.get("/dashboard", auth, adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalRatings = await Rating.countDocuments();
        
        const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);
        const recentUsers = await User.find().select("-password").sort({ _id: -1 }).limit(5);
        
        res.json({
            statistics: {
                totalUsers,
                totalProducts,
                totalOrders,
                totalRatings
            },
            recentOrders,
            recentUsers
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Get all users (Admin only)
router.get("/users", auth, adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const users = await User.find()
            .select("-password")
            .skip(skip)
            .limit(limit)
            .sort({ _id: -1 });
            
        const total = await User.countDocuments();
        
        res.json({
            users,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Update user status (Admin only)
router.put("/users/:id", auth, adminAuth, async (req, res) => {
    try {
        const { isAdmin } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isAdmin },
            { new: true }
        ).select("-password");
        
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }
        
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Delete user (Admin only)
router.delete("/users/:id", auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }
        
        res.json({ msg: "User deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Get all products (Admin only)
router.get("/products", auth, adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const products = await Product.find()
            .skip(skip)
            .limit(limit)
            .sort({ _id: -1 });
            
        const total = await Product.countDocuments();
        
        res.json({
            products,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Add new product (Admin only)
router.post("/products", auth, adminAuth, async (req, res) => {
    try {
        const { id, name, price, des, not, general, myproduct, dimensions, warranty, image, image1, image2, image3, image4, sale, averagerate, ratecount, quantity } = req.body;
        let product = await Product.findOne({ id: id });

        if (product) {
            // If product exists, update quantity
            product.quantity = (product.quantity || 0) + (quantity || 1);
            await product.save();
            res.json(product);
        } else {
            // If product does not exist, create new product
            product = new Product({
                id, name, price, des, not, general, myproduct, dimensions, warranty, image, image1, image2, image3, image4, sale, averagerate, ratecount, quantity: quantity || 1
            });
            await product.save();
            res.json(product);
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Update product (Admin only)
router.put("/products/:id", auth, adminAuth, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        
        if (!product) {
            return res.status(404).json({ msg: "Product not found" });
        }
        
        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Delete product (Admin only)
router.delete("/products/:id", auth, adminAuth, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        
        if (!product) {
            return res.status(404).json({ msg: "Product not found" });
        }
        
        res.json({ msg: "Product deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Get all orders (Admin only)
router.get("/orders", auth, adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const orders = await Order.find()
            .populate("userId", "name email")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
            
        const total = await Order.countDocuments();
        res.json({
            orders,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;



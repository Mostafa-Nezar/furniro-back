// ✅ userRoutes.js - نسخة تشمل MongoDB و JSON File

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const User = require('../models/user'); // MongoDB model

const usersPath = path.join(__dirname, '../data/users.json');
const loadUsers = () => JSON.parse(fs.readFileSync(usersPath));
const saveUsers = (users) => fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

// ✅ JSON File - Add to Cart
router.patch('/:id/add-to-cart', (req, res) => {
  const userId = parseInt(req.params.id);
  const { product } = req.body;

  const users = loadUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return res.status(404).json({ message: 'User not found' });

  const user = users[userIndex];
  if (!user.cart) user.cart = [];

  const existingItem = user.cart.find(p => p.id === product.id);

  if (existingItem) {
    // ✅ زود الكمية
    existingItem.quantity += 1;
  } else {
    // ✅ ضيف المنتج مع الكمية القادمة من الـ frontend (عادة 1)
    user.cart.push({ ...product });
  }

  saveUsers(users);
  res.json({ message: 'Product added/updated in cart', cart: user.cart });
});

router.patch("/:id/remove-from-cart", (req, res) => {
  const userId = parseInt(req.params.id);
  const { productId } = req.body;

  const users = loadUsers();
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) return res.status(404).json({ message: "User not found" });

  const user = users[userIndex];
  if (!user.cart) user.cart = [];

  user.cart = user.cart.filter((item) => item.id !== productId);
  saveUsers(users);

  res.json({ message: "Product removed from cart", cart: user.cart });
});

// ✅ JSON File - Update Favorites
router.put('/:id/favorites', (req, res) => {
  const userId = parseInt(req.params.id);
  const { favorites } = req.body;
  const users = loadUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) return res.status(404).json({ message: 'User not found' });

  users[userIndex].favorites = favorites;
  saveUsers(users);
  res.json({ message: 'Favorites updated', favorites });
});

// ✅ MongoDB - Overwrite Cart
router.put('/:userId/cart', async (req, res) => {
  try {
    const { userId } = req.params;
    const { cart } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.cart = cart;
    await user.save();

    res.json({ message: 'Cart updated successfully', cart: user.cart });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ✅ MongoDB - Update Favorites
router.put('/:userId/favorites', async (req, res) => {
  try {
    const { userId } = req.params;
    const { favorites } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.favorites = favorites;
    await user.save();

    res.json({ message: 'Favorites updated successfully', favorites: user.favorites });
  } catch (error) {
    console.error('Error updating favorites:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
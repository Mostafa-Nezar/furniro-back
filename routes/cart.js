const express = require('express');
const router = express.Router();
const User = require('../models/user');

router.patch('/:id/add-to-cart', async (req, res) => {
  const userId = parseInt(req.params.id);
  const { productId, quantity = 1 } = req.body;

  try {
    const user = await User.findOne({ id: parseInt(userId) });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.cart) user.cart = [];
    
    const existingItemIndex = user.cart.findIndex((item) => item.id == productId);

    if (existingItemIndex !== -1) {
      user.cart[existingItemIndex].quantity += quantity;
    } else {
      user.cart.push({
        id: productId,
        name: req.body.name,
        price: req.body.price,
        image: req.body.image,
        quantity: quantity,
      });
    }
    await user.save();
    res.json({ message: 'Product added/updated in cart', cart: user.cart });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.patch('/:id/remove-from-cart', async (req, res) => {
  const userId = parseInt(req.params.id);
  const { productId } = req.body;

  try {
    const user = await User.findOne({ id: userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.cart = (user.cart || []).filter((item) => item.product !== productId);
    await user.save();

    res.json({ message: 'Product removed from cart', cart: user.cart });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id/cart', async (req, res) => {
  const userId = parseInt(req.params.id);
  const { cart } = req.body;

  try {
    const user = await User.findOne({ id: userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.cart = cart;
    await user.save();

    res.json({ message: 'Cart updated successfully', cart: user.cart });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

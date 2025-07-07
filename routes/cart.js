const express = require('express');
const router = express.Router();
const User = require('../models/user');

router.patch('/:id/add-to-cart', async (req, res) => {
  const userId = parseInt(req.params.id);
  const { productId, quantity = 1 } = req.body;

  try {
    const user = await User.findOne({ id: userId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.cart) user.cart = [];

    // تحويل productId إلى number للتأكد من التطابق
    const numericProductId = parseInt(productId);
    const existingItemIndex = user.cart.findIndex((item) => parseInt(item.id) === numericProductId);

    if (existingItemIndex !== -1) {
      user.cart[existingItemIndex].quantity += quantity;
    } else {
      user.cart.push({
        id: numericProductId,
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

    console.log("✅ قبل الحذف، cart الحالي:");
    console.log(user.cart);

    console.log("🔍 productId المطلوب حذفه:", productId);

    // تحويل productId إلى number للتأكد من التطابق
    const numericProductId = parseInt(productId);
    user.cart = (user.cart || []).filter((item) => parseInt(item.id) !== numericProductId);

    console.log("🗑️ بعد الحذف، cart الجديد:");
    console.log(user.cart);

    await user.save();

    console.log("💾 تم حفظ cart الجديد للمستخدم");

    res.json({ message: 'Product removed from cart', cart: user.cart });
  } catch (error) {
    console.error('❌ Error removing from cart:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// إضافة route جديد لتحديث كمية المنتج
router.patch('/:id/update-cart-quantity', async (req, res) => {
  const userId = parseInt(req.params.id);
  const { productId, quantity } = req.body;

  try {
    const user = await User.findOne({ id: userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const numericProductId = parseInt(productId);
    const itemIndex = user.cart.findIndex((item) => parseInt(item.id) === numericProductId);

    if (itemIndex !== -1) {
      if (quantity <= 0) {
        // إذا كانت الكمية 0 أو أقل، احذف المنتج
        user.cart.splice(itemIndex, 1);
      } else {
        // تحديث الكمية
        user.cart[itemIndex].quantity = quantity;
      }
      
      await user.save();
      res.json({ message: 'Cart quantity updated', cart: user.cart });
    } else {
      res.status(404).json({ message: 'Product not found in cart' });
    }
  } catch (error) {
    console.error('Error updating cart quantity:', error);
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


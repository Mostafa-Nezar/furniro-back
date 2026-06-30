
const Cart = require("../models/cart");
const Product = require("../models/product");

exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id }).populate(
      "items.productId"
    );

    if (!cart) {
      cart = await Cart.create({
        userId: req.user._id,
        items: [],
      });
    }

    return res.json(cart);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.addItem = async (req, res) => {
  try {
    const { productId, quantity = 1, color, size } = req.body;

    const product = await Product.findOne({ id: Number(productId) });

    if (!product)
      return res.status(404).json({ msg: "Product not found" });

    if (product.quantity <= 0)
      return res.status(400).json({ msg: "Out of stock" });

    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = await Cart.create({userId: req.user._id, items: []});

      req.user.cart = cart._id;
      await req.user.save();
    }

    const existingItem = cart.items.find(
      (item) =>
        item.productId.toString() === product._id.toString() &&
        item.variant.color === color &&
        item.variant.size === size
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > 10)
        return res
          .status(400)
          .json({ msg: "Maximum quantity is 10" });

      if (newQuantity > product.quantity)
        return res.status(400).json({
          msg: `Only ${product.quantity} item(s) available`,
        });

      existingItem.quantity = newQuantity;
    } else {
      if (quantity > 10)
        return res
          .status(400)
          .json({ msg: "Maximum quantity is 10" });

      if (quantity > product.quantity)
        return res.status(400).json({
          msg: `Only ${product.quantity} item(s) available`,
        });

      cart.items.push({
        productId: product._id,
        quantity,
        priceAtAdd: product.salePrice || product.price,
        variant: {
          color,
          size,
        },
      });
    }

    cart.totalItems = cart.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    cart.totalPrice = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.priceAtAdd,
      0
    );

    await cart.save();

    cart = await cart.populate("items.productId");

    return res.json(cart);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
};


exports.updateItem = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const { quantity, color, size } = req.body;

    const product = await Product.findOne({ id: productId });

    if (!product) return res.status(404).json({ msg: "Product not found" });

    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) return res.status(404).json({ msg: "Cart not found" });

    const item = cart.items.find((i) => i.productId.toString() === product._id.toString());

    if (!item) return res.status(404).json({ msg: "Item not found in cart" });

    if (quantity !== undefined) {
      if (quantity < 1) {
        cart.items = cart.items.filter((i) => i.productId.toString() !== product._id.toString());
      } else {
        if (quantity > 10) return res.status(400).json({ msg: "Maximum quantity is 10" });

        if (quantity > product.quantity) return res.status(400).json({ msg: `Only ${product.quantity} item(s) available`});
        item.quantity = quantity;
      }
    }

    if (color !== undefined) {
      item.color = color;
    }

    if (size !== undefined) {
      item.size = size;
    }

    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity,0);

    cart.totalPrice = cart.items.reduce((sum, item) => sum + item.quantity * item.priceAtAdd, 0);

    await cart.save();
    await cart.populate("items.productId");

    return res.json(cart);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const productId = Number(req.params.productId);

    const product = await Product.findOne({ id: productId });

    if (!product)
      return res.status(404).json({ msg: "Product not found" });

    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart)
      return res.status(404).json({ msg: "Cart not found" });

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== product._id.toString()
    );

    cart.totalItems = cart.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    cart.totalPrice = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.priceAtAdd,
      0
    );

    await cart.save();

    await cart.populate("items.productId");

    return res.json(cart);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart)
      return res.json({
        items: [],
        totalItems: 0,
        totalPrice: 0,
      });

    cart.items = [];
    cart.totalItems = 0;
    cart.totalPrice = 0;

    await cart.save();

    return res.json(cart);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
};

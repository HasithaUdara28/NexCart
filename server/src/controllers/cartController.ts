import { Request, Response } from 'express';
import { Cart } from '../models/mongo/Cart';
import { Product } from '../models/mongo/Product';

const userId = (req: Request): string => String(req.user!.id);

const calcTotal = (items: { price: number; quantity: number }[]): number =>
  items.reduce((sum, i) => sum + i.price * i.quantity, 0);

export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const cart = await Cart.findOne({ userId: userId(req) });
    if (!cart) {
      res.json({ items: [], total: 0 });
      return;
    }

    const productIds = cart.items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).select(
      'name price images'
    );
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const enriched = cart.items.map((item) => ({
      productId: item.productId,
      quantity:  item.quantity,
      price:     item.price,
      product:   productMap.get(item.productId) ?? null,
    }));

    res.json({ items: enriched, total: calcTotal(cart.items) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const addToCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = Number(quantity);

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    if (product.stock < qty) {
      res.status(400).json({ message: 'Insufficient stock' });
      return;
    }

    let cart = await Cart.findOne({ userId: userId(req) });

    if (cart) {
      const idx = cart.items.findIndex((i) => i.productId === String(productId));
      if (idx !== -1) {
        cart.items[idx].quantity += qty;
      } else {
        cart.items.push({ productId: String(productId), quantity: qty, price: product.price });
      }
      await cart.save();
    } else {
      cart = await Cart.create({
        userId: userId(req),
        items:  [{ productId: String(productId), quantity: qty, price: product.price }],
      });
    }

    res.status(201).json({ items: cart.items, total: calcTotal(cart.items) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const updateCartItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const quantity = Number(req.body.quantity);

    const cart = await Cart.findOne({ userId: userId(req) });
    if (!cart) {
      res.status(404).json({ message: 'Cart not found' });
      return;
    }

    if (quantity === 0) {
      cart.items = cart.items.filter((i) => i.productId !== productId);
    } else {
      const item = cart.items.find((i) => i.productId === productId);
      if (!item) {
        res.status(404).json({ message: 'Item not in cart' });
        return;
      }
      item.quantity = quantity;
    }

    await cart.save();
    res.json({ items: cart.items, total: calcTotal(cart.items) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const removeFromCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId: userId(req) });
    if (!cart) {
      res.status(404).json({ message: 'Cart not found' });
      return;
    }

    cart.items = cart.items.filter((i) => i.productId !== productId);
    await cart.save();
    res.json({ items: cart.items, total: calcTotal(cart.items) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const clearCart = async (req: Request, res: Response): Promise<void> => {
  try {
    await Cart.findOneAndDelete({ userId: userId(req) });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

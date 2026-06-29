import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { stripe } from '../config/stripe';
import { Cart } from '../models/mongo/Cart';
import { Product } from '../models/mongo/Product';

const VALID_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

export const createPaymentIntent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) < 50) {
      res.status(400).json({ message: 'Amount must be at least 50 pence' });
      return;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   Number(amount),
      currency: 'gbp',
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stripePaymentId } = req.body;
    const uid = String(req.user!.id);

    const cart = await Cart.findOne({ userId: uid });
    if (!cart || cart.items.length === 0) {
      res.status(400).json({ message: 'Cart is empty' });
      return;
    }

    const total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // create order + items in Postgres in one transaction
    const order = await prisma.order.create({
      data: {
        userId:         req.user!.id,
        total,
        stripePaymentId: stripePaymentId ?? null,
        items: {
          create: cart.items.map((i) => ({
            productId: i.productId,
            quantity:  i.quantity,
            price:     i.price,
          })),
        },
      },
      include: { items: true },
    });

    // deduct stock in MongoDB
    await Promise.all(
      cart.items.map((i) =>
        Product.findByIdAndUpdate(i.productId, { $inc: { stock: -i.quantity } })
      )
    );

    // clear cart
    await Cart.findOneAndDelete({ userId: uid });

    // mark as paid
    const paid = await prisma.order.update({
      where: { id: order.id },
      data:  { status: 'paid' },
      include: { items: true },
    });

    res.status(201).json(paid);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      where:   { userId: req.user!.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const getOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await prisma.order.findUnique({
      where:   { id: Number(req.params.id) },
      include: { items: true },
    });

    if (!order || order.userId !== req.user!.id) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    const orders = await prisma.order.findMany({
      where:   status ? { status: String(status) } : undefined,
      include: {
        items: true,
        user:  { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
      return;
    }

    const order = await prisma.order.update({
      where:   { id: Number(req.params.id) },
      data:    { status },
      include: { items: true },
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};
